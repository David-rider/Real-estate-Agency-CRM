import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { createNotification } from './notifications';
import { checkRefs, isManager, optDate, optNumber, pickEnum } from '../lib/access';

const router = express.Router();
const STATUSES = ['SCHEDULED', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED'] as const;
const TYPES = ['SHOWING', 'MEETING', 'CALL', 'OPEN_HOUSE', 'INSPECTION', 'CLOSING', 'FOLLOW_UP'] as const;

// GET /api/appointments?from=&to=&agentId=
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const where: any = { orgId: user.orgId };
    // Managers can look at a teammate's calendar; everyone else sees their own
    if (isManager(user) && typeof req.query.agentId === 'string') where.agentId = req.query.agentId;
    else if (!(isManager(user) && req.query.scope === 'org')) where.agentId = user.userId;

    const from = optDate(req.query.from);
    const to = optDate(req.query.to);
    if (from || to) where.date = { ...(from ? { gte: from } : {}), ...(to ? { lte: to } : {}) };

    const appointments = await prisma.appointment.findMany({
        where,
        include: {
            client:   { select: { id: true, firstName: true, lastName: true, phone: true, email: true } },
            property: { select: { id: true, address: true, city: true } },
        },
        orderBy: { date: 'asc' },
        take: 500,
    });
    res.json(appointments);
});

function parseFields(body: any) {
    const data: any = {};
    if (typeof body.title === 'string') data.title = body.title.trim();
    const date = optDate(body.date);
    if (date) data.date = date;
    const endDate = optDate(body.endDate);
    if (endDate !== undefined) data.endDate = endDate;
    const status = pickEnum(body.status, STATUSES);
    if (status) data.status = status;
    const type = pickEnum(body.type, TYPES);
    if (type) data.type = type;
    const durationMin = optNumber(body.durationMin);
    if (durationMin !== undefined) data.durationMin = Math.round(durationMin);
    for (const f of ['notes', 'location', 'virtualLink', 'colorCode']) {
        if (body[f] !== undefined) data[f] = body[f] === null || body[f] === '' ? null : String(body[f]);
    }
    for (const f of ['clientId', 'propertyId']) {
        if (body[f] !== undefined) data[f] = body[f] || null;
    }
    return data;
}

// POST /api/appointments
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const data = parseFields(req.body);
    if (!data.title) return res.status(400).json({ error: 'Title is required' });
    if (!data.date) return res.status(400).json({ error: 'A valid date is required' });
    const refErr = await checkRefs(user.orgId, { clientId: data.clientId, propertyId: data.propertyId });
    if (refErr) return res.status(400).json({ error: refErr });

    const appointment = await prisma.appointment.create({
        data: { ...data, status: data.status ?? 'SCHEDULED', agentId: user.userId, orgId: user.orgId },
    });

    const when = appointment.date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
    await createNotification(user.userId, user.orgId, 'APPOINTMENT_REMINDER', 'Appointment scheduled',
        `"${appointment.title}" is scheduled for ${when}.`, '/appointments');
    if (appointment.clientId && appointment.type === 'SHOWING') {
        await prisma.client.updateMany({
            where: { id: appointment.clientId, funnelStage: { in: ['LEAD', 'QUALIFIED'] } },
            data: { funnelStage: 'SHOWING' },
        });
    }
    res.status(201).json(appointment);
});

async function findEditable(req: AuthRequest) {
    const user = req.user!;
    const appt = await prisma.appointment.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!appt) return { error: 404 as const };
    if (appt.agentId !== user.userId && !isManager(user)) return { error: 403 as const };
    return { appt };
}

// PATCH /api/appointments/:id — reschedule, confirm, complete, cancel…
router.patch('/:id', async (req: AuthRequest, res) => {
    const found = await findEditable(req);
    if (found.error === 404) return res.status(404).json({ error: 'Appointment not found' });
    if (found.error === 403) return res.status(403).json({ error: 'Forbidden' });

    const data = parseFields(req.body);
    if ('title' in data && !data.title) return res.status(400).json({ error: 'Title cannot be empty' });
    const refErr = await checkRefs(req.user!.orgId, { clientId: data.clientId, propertyId: data.propertyId });
    if (refErr) return res.status(400).json({ error: refErr });

    const updated = await prisma.appointment.update({ where: { id: found.appt!.id }, data });
    // A completed meeting counts as contact with the client
    if (data.status === 'COMPLETED' && updated.clientId) {
        await prisma.client.update({ where: { id: updated.clientId }, data: { lastContactedAt: new Date() } });
    }
    res.json(updated);
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    const found = await findEditable(req);
    if (found.error === 404) return res.status(404).json({ error: 'Appointment not found' });
    if (found.error === 403) return res.status(403).json({ error: 'Forbidden' });
    await prisma.appointment.delete({ where: { id: found.appt!.id } });
    res.json({ message: 'Appointment deleted' });
});

export default router;
