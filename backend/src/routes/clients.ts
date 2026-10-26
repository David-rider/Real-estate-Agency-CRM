import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { clientScope, checkRefs, isManager, optDate, pickEnum, AuthUser } from '../lib/access';
import { audit } from '../lib/audit';
import { createNotification } from './notifications';

const router = Router();

// Role-based CRM access
// - Management sees the whole org; AGENT sees only their own clients
// - OFFICE_SUPPORT / MARKETING get read-only org view
// - ATTORNEY / LENDER / TITLECO have no CRM access
const CRM_WRITE_ROLES = ['SUPERADMIN', 'FIRMADMIN', 'MANAGER', 'AGENT'];
const CRM_READ_ROLES  = [...CRM_WRITE_ROLES, 'OFFICE_SUPPORT', 'MARKETING'];

const CLIENT_TYPES    = ['BUYER', 'SELLER', 'REFERRAL', 'RENTER', 'INVESTOR'] as const;
const CLIENT_STATUSES = ['LEAD', 'ACTIVE', 'IN_CONTRACT', 'CLOSED', 'ARCHIVED'] as const;
const FUNNEL_STAGES   = ['LEAD', 'QUALIFIED', 'SHOWING', 'OFFERING', 'IN_CONTRACT', 'CLOSED', 'ARCHIVED'] as const;
const TEMPERATURES    = ['HOT', 'WARM', 'COLD'] as const;
const ACTIVITY_TYPES  = ['NOTE', 'CALL', 'EMAIL', 'TEXT', 'MEETING', 'SHOWING'] as const;

// A lead nobody has touched in this many days shows up as "needs follow-up"
export const STALE_DAYS = 14;

function canRead(user: AuthUser)  { return CRM_READ_ROLES.includes(user.role); }
function canWrite(user: AuthUser) { return CRM_WRITE_ROLES.includes(user.role); }

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : undefined);
const optStr = (v: unknown) => {
    if (v === undefined) return undefined;
    if (v === null) return null;
    const s = String(v).trim();
    return s === '' ? null : s;
};

// Shared field parsing for create + update. Unknown/invalid values are dropped.
function clientFields(body: any) {
    const data: Record<string, unknown> = {};
    const textFields = ['email', 'phone', 'budget', 'source', 'tags', 'notes', 'preferredContact', 'referredBy'];
    for (const f of textFields) {
        const v = optStr(body[f]);
        if (v !== undefined) data[f] = f === 'email' && v ? v.toLowerCase() : v;
    }
    const firstName = str(body.firstName);
    const lastName  = str(body.lastName);
    if (firstName) data.firstName = firstName;
    if (lastName !== undefined) data.lastName = lastName;

    const type        = pickEnum(body.type, CLIENT_TYPES);
    const status      = pickEnum(body.status, CLIENT_STATUSES);
    const funnelStage = pickEnum(body.funnelStage, FUNNEL_STAGES);
    const temperature = pickEnum(body.temperature, TEMPERATURES);
    if (type) data.type = type;
    if (status) data.status = status;
    if (funnelStage) data.funnelStage = funnelStage;
    if (temperature) data.temperature = temperature;

    const targetMoveDate = optDate(body.targetMoveDate);
    if (targetMoveDate !== undefined) data.targetMoveDate = targetMoveDate;
    const coAgentId = optStr(body.coAgentId);
    if (coAgentId !== undefined) data.coAgentId = coAgentId;
    return data;
}

// GET /api/clients — paginated, server-side search & filters
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canRead(user)) return res.status(403).json({ error: 'Your role does not have CRM access' });

    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 10));
    const skip  = (page - 1) * limit;

    const and: any[] = [clientScope(user)];
    const q = (req.query.q as string | undefined)?.trim() || (req.query.search as string | undefined)?.trim();
    if (q) {
        const mode = 'insensitive' as const;
        const parts = q.split(/\s+/).filter(Boolean);
        and.push({
            AND: parts.map(p => ({
                OR: [
                    { firstName: { contains: p, mode } },
                    { lastName:  { contains: p, mode } },
                    { email:     { contains: p, mode } },
                    { phone:     { contains: p, mode } },
                    { tags:      { contains: p, mode } },
                ],
            })),
        });
    }
    const type        = pickEnum(req.query.type, CLIENT_TYPES);
    const status      = pickEnum(req.query.status, CLIENT_STATUSES);
    const funnelStage = pickEnum(req.query.funnelStage, FUNNEL_STAGES);
    const temperature = pickEnum(req.query.temperature, TEMPERATURES);
    if (type) and.push({ type });
    if (status) and.push({ status });
    else if (req.query.includeArchived !== 'true') and.push({ status: { not: 'ARCHIVED' } });
    if (funnelStage) and.push({ funnelStage });
    if (temperature) and.push({ temperature });
    if (typeof req.query.source === 'string' && req.query.source) and.push({ source: req.query.source });
    if (req.query.stale === 'true') {
        const cutoff = new Date(Date.now() - STALE_DAYS * 24 * 60 * 60 * 1000);
        and.push({ status: { notIn: ['CLOSED', 'ARCHIVED'] } });
        and.push({ OR: [{ lastContactedAt: null }, { lastContactedAt: { lt: cutoff } }] });
    }

    const where = { AND: and };
    const [clients, total] = await Promise.all([
        prisma.client.findMany({
            where, skip, take: limit,
            orderBy: { createdAt: 'desc' },
            include: { agent: { select: { id: true, name: true } } },
        }),
        prisma.client.count({ where }),
    ]);

    res.json({ data: clients, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// POST /api/clients — create. Returns 409 on a likely duplicate unless force=true.
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canWrite(user)) return res.status(403).json({ error: 'Your role cannot create clients' });

    const data = clientFields(req.body);
    if (!data.firstName) return res.status(400).json({ error: 'First name is required' });
    if (data.lastName === undefined) data.lastName = '';
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
        return res.status(400).json({ error: 'Invalid email address' });
    }

    // Managers may assign the lead to another agent in their org
    let agentId = user.userId;
    if (req.body.agentId && req.body.agentId !== user.userId) {
        if (!isManager(user)) return res.status(403).json({ error: 'Only managers can assign clients to other agents' });
        const err = await checkRefs(user.orgId, { userId: req.body.agentId });
        if (err) return res.status(400).json({ error: 'Assigned agent not found' });
        agentId = req.body.agentId;
    }
    if (data.coAgentId) {
        const err = await checkRefs(user.orgId, { userId: String(data.coAgentId) });
        if (err) return res.status(400).json({ error: 'Co-agent not found' });
    }

    if (req.body.force !== true && (data.email || data.phone)) {
        const or: any[] = [];
        if (data.email) or.push({ email: { equals: String(data.email), mode: 'insensitive' } });
        if (data.phone) or.push({ phone: String(data.phone) });
        const dup = await prisma.client.findFirst({
            where: { orgId: user.orgId, OR: or },
            select: { id: true, firstName: true, lastName: true, agent: { select: { name: true } } },
        });
        if (dup) {
            return res.status(409).json({
                error: `A client with this email or phone already exists: ${dup.firstName} ${dup.lastName} (agent: ${dup.agent.name})`,
                duplicateId: dup.id,
            });
        }
    }

    const client = await prisma.client.create({
        data: {
            ...(data as any),
            status: data.status ?? 'LEAD',
            funnelStage: data.funnelStage ?? 'LEAD',
            agentId,
            orgId: user.orgId,
        },
    });

    if (agentId !== user.userId) {
        await createNotification(agentId, user.orgId, 'NEW_CLIENT', 'New client assigned to you',
            `${client.firstName} ${client.lastName} was assigned to you.`, `/crm/${client.id}`);
    }
    res.status(201).json(client);
});

// POST /api/clients/import — bulk CSV import with duplicate handling ('skip' | 'update')
router.post('/import', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canWrite(user)) return res.status(403).json({ error: 'Your role cannot import clients' });

    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    const onDuplicate = req.body.onDuplicate === 'update' ? 'update' : 'skip';
    if (rows.length === 0) return res.status(400).json({ error: 'No rows provided' });
    if (rows.length > 500) return res.status(400).json({ error: 'Maximum 500 rows per import batch' });

    let created = 0;
    let updated = 0;
    let skipped = 0;
    const errors: { row: number; reason: string }[] = [];

    for (let i = 0; i < rows.length; i++) {
        const raw = rows[i] || {};
        const data = clientFields(raw);
        if (!data.firstName && typeof raw.fullName === 'string' && raw.fullName.trim()) {
            const parts = raw.fullName.trim().split(/\s+/);
            data.firstName = parts[0];
            if (!data.lastName) data.lastName = parts.slice(1).join(' ');
        }
        if (!data.firstName) {
            errors.push({ row: i + 1, reason: 'First name is required' });
            continue;
        }
        if (data.lastName === undefined) data.lastName = '';
        if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(data.email))) {
            errors.push({ row: i + 1, reason: `Invalid email: ${data.email}` });
            continue;
        }

        const or: any[] = [];
        if (data.email) or.push({ email: { equals: String(data.email), mode: 'insensitive' } });
        if (data.phone) or.push({ phone: String(data.phone) });

        if (or.length > 0) {
            const existing = await prisma.client.findFirst({
                where: { orgId: user.orgId, OR: or },
                select: { id: true, agentId: true },
            });
            if (existing) {
                if (onDuplicate === 'update' && (isManager(user) || existing.agentId === user.userId)) {
                    await prisma.client.update({ where: { id: existing.id }, data: data as any });
                    updated++;
                } else {
                    skipped++;
                }
                continue;
            }
        }

        await prisma.client.create({
            data: {
                ...(data as any),
                type: data.type ?? 'BUYER',
                status: data.status ?? 'LEAD',
                funnelStage: data.funnelStage ?? 'LEAD',
                temperature: data.temperature ?? 'WARM',
                source: data.source ?? 'CSV Import',
                agentId: user.userId,
                orgId: user.orgId,
            },
        });
        created++;
    }

    await audit(req, 'BULK_IMPORT_CLIENTS', 'Client', user.orgId, null, { created, updated, skipped, errorCount: errors.length });
    res.json({ created, updated, skipped, errors });
});

// GET /api/clients/:id
router.get('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canRead(user)) return res.status(403).json({ error: 'Your role does not have CRM access' });

    const client = await prisma.client.findFirst({
        where: { id: String(req.params.id), ...clientScope(user) },
        include: {
            agent: { select: { id: true, name: true, email: true, phone: true } },
            clientNotes: {
                orderBy: { createdAt: 'desc' },
                take: 50,
                include: { author: { select: { name: true } } },
            },
        },
    });
    if (!client) return res.status(404).json({ error: 'Client not found' });
    res.json(client);
});

// GET /api/clients/:id/timeline — every touchpoint, newest first
router.get('/:id/timeline', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canRead(user)) return res.status(403).json({ error: 'Your role does not have CRM access' });
    const id = String(req.params.id);
    const orgId = user.orgId;

    const client = await prisma.client.findFirst({ where: { id, ...clientScope(user) } });
    if (!client) return res.status(404).json({ error: 'Client not found' });

    const [offers, appointments, giftOrders, transactions, notes, tasks] = await Promise.all([
        prisma.offer.findMany({ where: { clientId: id, orgId }, include: { property: true } }),
        prisma.appointment.findMany({ where: { clientId: id, orgId }, include: { property: true } }),
        prisma.giftOrder.findMany({ where: { clientId: id, orgId } }),
        prisma.transaction.findMany({ where: { clientId: id, orgId }, include: { property: true } }),
        prisma.note.findMany({ where: { clientId: id, orgId }, include: { author: { select: { name: true } } } }),
        prisma.task.findMany({ where: { linkedClientId: id, orgId } }),
    ]);

    const events = [
        ...notes.map(n => ({
            id: n.id, type: 'NOTE', subtype: n.type,
            title: `${n.type.charAt(0)}${n.type.slice(1).toLowerCase()} logged by ${n.author.name}`,
            description: n.content, date: n.createdAt,
        })),
        ...offers.map(o => ({
            id: o.id, type: 'OFFER',
            title: `Offer for ${o.property.address}`,
            description: `$${o.amount.toLocaleString()} — ${o.status}`, date: o.createdAt, status: o.status,
        })),
        ...appointments.map(a => ({
            id: a.id, type: 'APPOINTMENT',
            title: `${a.type.replace('_', ' ')}: ${a.title}`,
            description: a.property ? `At ${a.property.address}` : (a.notes || a.location || ''), date: a.date, status: a.status,
        })),
        ...giftOrders.map(g => ({
            id: g.id, type: 'GIFT', title: `Gift: ${g.item}`, description: `Status: ${g.status}`, date: g.createdAt, status: g.status,
        })),
        ...transactions.map(t => ({
            id: t.id, type: 'TRANSACTION', title: `Deal ${t.status.replace(/_/g, ' ')}`,
            description: `Property: ${t.property.address}`, date: t.updatedAt, status: t.status,
        })),
        ...tasks.map(t => ({
            id: t.id, type: 'TASK', title: `Task: ${t.title}`,
            description: t.dueDate ? `Due ${t.dueDate.toISOString().slice(0, 10)}` : '', date: t.createdAt, status: t.status,
        })),
        {
            id: `creation-${client.id}`, type: 'MODIFICATION', title: 'Client record created',
            description: `Added as ${client.type}${client.source ? ` via ${client.source}` : ''}`, date: client.createdAt,
        },
    ];
    events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    res.json(events);
});

// PATCH /api/clients/:id
router.patch('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canWrite(user)) return res.status(403).json({ error: 'Your role cannot edit clients' });
    const id = String(req.params.id);

    const existing = await prisma.client.findFirst({ where: { id, ...clientScope(user) } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });

    const data = clientFields(req.body);
    if ('firstName' in req.body && !data.firstName) return res.status(400).json({ error: 'First name cannot be empty' });
    if (data.coAgentId) {
        const err = await checkRefs(user.orgId, { userId: String(data.coAgentId) });
        if (err) return res.status(400).json({ error: 'Co-agent not found' });
    }
    // Reassignment is a management action
    if (req.body.agentId && req.body.agentId !== existing.agentId) {
        if (!isManager(user)) return res.status(403).json({ error: 'Only managers can reassign clients' });
        const err = await checkRefs(user.orgId, { userId: req.body.agentId });
        if (err) return res.status(400).json({ error: 'Assigned agent not found' });
        data.agentId = req.body.agentId;
    }

    const client = await prisma.client.update({ where: { id }, data: data as any });
    if (data.agentId) {
        await audit(req, 'REASSIGN_CLIENT', 'Client', id, { agentId: existing.agentId }, { agentId: data.agentId });
        await createNotification(String(data.agentId), user.orgId, 'NEW_CLIENT', 'Client assigned to you',
            `${client.firstName} ${client.lastName} was assigned to you.`, `/crm/${client.id}`);
    }
    res.json(client);
});

// DELETE /api/clients/:id — archives (soft delete) so deal history is preserved
router.delete('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const id = String(req.params.id);
    const existing = await prisma.client.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return res.status(404).json({ error: 'Client not found' });
    if (!(isManager(user) || (user.role === 'AGENT' && existing.agentId === user.userId))) {
        return res.status(403).json({ error: 'Forbidden' });
    }
    await prisma.client.update({ where: { id }, data: { status: 'ARCHIVED', funnelStage: 'ARCHIVED' } });
    await audit(req, 'ARCHIVE_CLIENT', 'Client', id, { status: existing.status }, { status: 'ARCHIVED' });
    res.json({ message: 'Client archived' });
});

// POST /api/clients/:id/activities — log a call / email / meeting / note
router.post('/:id/activities', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!canWrite(user)) return res.status(403).json({ error: 'Your role cannot log activities' });
    const id = String(req.params.id);

    const client = await prisma.client.findFirst({ where: { id, ...clientScope(user) } });
    if (!client) return res.status(404).json({ error: 'Client not found or access denied' });

    const type = pickEnum(req.body.type, ACTIVITY_TYPES) ?? 'NOTE';
    const subject = str(req.body.subject);
    const content = str(req.body.content);
    if (!subject && !content) return res.status(400).json({ error: 'Add a subject or some notes' });

    const [note] = await prisma.$transaction([
        prisma.note.create({
            data: {
                type,
                content: subject && content ? `${subject}\n${content}` : (subject || content)!,
                clientId: id,
                authorId: user.userId,
                orgId: user.orgId,
            },
        }),
        prisma.client.update({ where: { id }, data: { lastContactedAt: new Date() } }),
    ]);

    // Optional follow-up reminder, e.g. { followUpDate: '2026-11-01' }
    const followUp = optDate(req.body.followUpDate);
    if (followUp) {
        await prisma.task.create({
            data: {
                title: `Follow up with ${client.firstName} ${client.lastName}`,
                dueDate: followUp, priority: 'MEDIUM',
                linkedClientId: id, agentId: user.userId, orgId: user.orgId,
            },
        });
    }
    res.status(201).json(note);
});

export default router;
