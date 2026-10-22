import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { checkRefs, isManager, optDate, optNumber, pickEnum, AuthUser } from '../lib/access';
import { createClosingChecklist, onTransactionStatusChange } from '../lib/deals';
import { audit } from '../lib/audit';

const router = Router();
router.use(authenticateToken);

const STATUSES = ['OFFER_REVIEW', 'IN_CONTRACT', 'BOARD_PACKAGE', 'CLEARED_TO_CLOSE', 'CLOSED', 'FALLEN_THROUGH'] as const;
const DEAL_ROLES = ['SUPERADMIN', 'FIRMADMIN', 'MANAGER', 'AGENT', 'OFFICE_SUPPORT', 'ATTORNEY', 'LENDER', 'TITLECO'];

// Agents (and outside parties) only see deals they are on; management sees the org
function txScope(user: AuthUser) {
    if (isManager(user) || user.role === 'OFFICE_SUPPORT') return { orgId: user.orgId };
    return { orgId: user.orgId, OR: [{ agentId: user.userId }, { coAgentId: user.userId }] };
}

function canEdit(user: AuthUser, tx: { agentId: string }) {
    return tx.agentId === user.userId || isManager(user);
}

// GET /api/transactions — paginated list with filters
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!DEAL_ROLES.includes(user.role)) return res.status(403).json({ error: 'Your role has no access to deals' });

    const page  = Math.max(1, parseInt(req.query.page as string) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 20));
    const skip  = (page - 1) * limit;

    const and: any[] = [txScope(user)];
    const status = pickEnum(req.query.status, STATUSES);
    if (status) and.push({ status });
    const q = (req.query.q as string | undefined)?.trim();
    if (q) {
        const mode = 'insensitive' as const;
        and.push({ OR: [
            { property: { address: { contains: q, mode } } },
            { client: { firstName: { contains: q, mode } } },
            { client: { lastName: { contains: q, mode } } },
        ] });
    }
    const where = { AND: and };

    const [transactions, total] = await Promise.all([
        prisma.transaction.findMany({
            where, skip, take: limit,
            include: {
                client:      { select: { id: true, firstName: true, lastName: true, email: true } },
                property:    { select: { id: true, address: true, city: true, price: true, propertyType: true } },
                agent:       { select: { id: true, name: true } },
                commissions: { select: { id: true, status: true, netPayout: true } },
            },
            orderBy: { createdAt: 'desc' },
        }),
        prisma.transaction.count({ where }),
    ]);

    res.json({ data: transactions, total, page, limit, totalPages: Math.ceil(total / limit) });
});

// GET /api/transactions/:id
router.get('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const transaction = await prisma.transaction.findFirst({
        where: { id: String(req.params.id), ...txScope(user) },
        include: {
            client:      true,
            property:    { include: { mediaAssets: { take: 1 } } },
            agent:       { select: { id: true, name: true, email: true, phone: true } },
            commissions: true,
            documents:   { orderBy: { createdAt: 'desc' } },
            transactionNotes: {
                include: { author: { select: { name: true, avatarUrl: true } } },
                orderBy: { createdAt: 'desc' },
            },
        },
    });
    if (!transaction) return res.status(404).json({ error: 'Transaction not found' });

    const checklist = await prisma.task.findMany({
        where: { linkedTransactionId: transaction.id, orgId: user.orgId },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'asc' }],
    });
    res.json({ ...transaction, checklist });
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    if (!['SUPERADMIN', 'FIRMADMIN', 'MANAGER', 'AGENT'].includes(user.role)) {
        return res.status(403).json({ error: 'Your role cannot create deals' });
    }
    const { propertyId, clientId, contingencies, notes } = req.body;
    if (!propertyId || !clientId) return res.status(400).json({ error: 'Property and client are required' });
    const price = optNumber(req.body.price);
    if (price === undefined || price <= 0) return res.status(400).json({ error: 'A valid price is required' });

    const refErr = await checkRefs(user.orgId, { propertyId, clientId });
    if (refErr) return res.status(400).json({ error: refErr });

    const commissionRate = optNumber(req.body.commissionRate);
    if (commissionRate !== undefined && (commissionRate < 0 || commissionRate > 100)) {
        return res.status(400).json({ error: 'Commission rate must be between 0 and 100' });
    }

    const status = pickEnum(req.body.status, STATUSES) ?? 'OFFER_REVIEW';
    const transaction = await prisma.transaction.create({
        data: {
            propertyId, clientId, price, status,
            contractDate:  optDate(req.body.contractDate) ?? null,
            closingDate:   optDate(req.body.closingDate) ?? null,
            contingencies: typeof contingencies === 'string' ? contingencies : null,
            notes:         typeof notes === 'string' ? notes : null,
            commissionRate: commissionRate ?? null,
            agentId: user.userId,
            orgId:   user.orgId,
        },
    });

    if (req.body.createChecklist !== false) await createClosingChecklist(transaction);
    await onTransactionStatusChange(transaction, null);

    const full = await prisma.transaction.findUnique({
        where: { id: transaction.id },
        include: {
            client:   { select: { firstName: true, lastName: true } },
            property: { select: { address: true, city: true } },
        },
    });
    res.status(201).json(full);
});

// PATCH /api/transactions/:id — update status and timeline fields
router.patch('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const id = String(req.params.id);
    const existing = await prisma.transaction.findFirst({ where: { id, orgId: user.orgId } });
    if (!existing) return res.status(404).json({ error: 'Transaction not found' });
    if (!canEdit(user, existing)) return res.status(403).json({ error: 'Forbidden' });

    const data: any = {};
    if (req.body.status !== undefined) {
        const status = pickEnum(req.body.status, STATUSES);
        if (!status) return res.status(400).json({ error: 'Invalid status' });
        data.status = status;
    }
    for (const f of ['price', 'acceptedPrice', 'commissionRate']) {
        if (req.body[f] === undefined) continue;
        if (req.body[f] === null || req.body[f] === '') { if (f !== 'price') data[f] = null; continue; }
        const n = optNumber(req.body[f]);
        if (n === undefined || n < 0) return res.status(400).json({ error: `Invalid ${f}` });
        data[f] = n;
    }
    for (const f of ['contractDate', 'inspectionDate', 'boardPackageDate', 'clearToCloseDate', 'closingDate']) {
        const d = optDate(req.body[f]);
        if (d !== undefined) data[f] = d;
    }
    for (const f of ['contingencies', 'notes']) {
        if (req.body[f] !== undefined) data[f] = req.body[f] === null ? null : String(req.body[f]);
    }

    const updated = await prisma.transaction.update({ where: { id }, data });
    if (data.status && data.status !== existing.status) {
        await audit(req, 'UPDATE_DEAL_STATUS', 'Transaction', id, { status: existing.status }, { status: data.status });
        await onTransactionStatusChange(updated, existing.status);
    }

    const full = await prisma.transaction.findUnique({
        where: { id },
        include: {
            client:      { select: { firstName: true, lastName: true } },
            property:    { select: { address: true, city: true } },
            commissions: { select: { id: true, status: true, netPayout: true } },
        },
    });
    res.json(full);
});

// POST /api/transactions/:id/notes
router.post('/:id/notes', async (req: AuthRequest, res) => {
    const user = req.user!;
    const tx = await prisma.transaction.findFirst({ where: { id: String(req.params.id), ...txScope(user) } });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';
    if (!content) return res.status(400).json({ error: 'Note content is required' });
    const note = await prisma.note.create({
        data: { content, type: 'NOTE', transactionId: tx.id, authorId: user.userId, orgId: user.orgId },
        include: { author: { select: { name: true } } },
    });
    res.status(201).json(note);
});

// DELETE /api/transactions/:id — only for deals entered by mistake (no commission yet)
router.delete('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const id = String(req.params.id);
    const tx = await prisma.transaction.findFirst({ where: { id, orgId: user.orgId }, include: { _count: { select: { commissions: true } } } });
    if (!tx) return res.status(404).json({ error: 'Transaction not found' });
    if (!canEdit(user, tx)) return res.status(403).json({ error: 'Forbidden' });
    if (tx._count.commissions > 0 || tx.status === 'CLOSED') {
        return res.status(400).json({ error: 'Closed deals with commissions cannot be deleted. Mark it as fallen through instead.' });
    }
    await prisma.$transaction([
        prisma.task.deleteMany({ where: { linkedTransactionId: id, orgId: user.orgId, status: { not: 'COMPLETED' } } }),
        prisma.transaction.delete({ where: { id } }),
    ]);
    await audit(req, 'DELETE_DEAL', 'Transaction', id, { status: tx.status, price: tx.price });
    res.json({ message: 'Transaction deleted' });
});

export default router;
