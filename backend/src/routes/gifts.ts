import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { checkRefs, isManager, optNumber } from '../lib/access';

const router = express.Router();
const STATUSES = ['ORDERED', 'SHIPPED', 'DELIVERED', 'CANCELLED'];

// GET /api/gifts
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const where: any = { orgId: user.orgId };
    if (!isManager(user)) where.agentId = user.userId;
    const gifts = await prisma.giftOrder.findMany({
        where,
        include: {
            client: { select: { id: true, firstName: true, lastName: true } },
            agent:  { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
    });
    res.json(gifts);
});

// POST /api/gifts
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const item = typeof req.body.item === 'string' ? req.body.item.trim() : '';
    const clientId = req.body.clientId;
    if (!item) return res.status(400).json({ error: 'Gift item is required' });
    if (!clientId) return res.status(400).json({ error: 'Choose a client' });
    const refErr = await checkRefs(user.orgId, { clientId });
    if (refErr) return res.status(400).json({ error: refErr });
    const gift = await prisma.giftOrder.create({
        data: {
            item, clientId,
            amount: optNumber(req.body.amount) ?? null,
            status: STATUSES.includes(req.body.status) ? req.body.status : 'ORDERED',
            agentId: user.userId, orgId: user.orgId,
        },
    });
    res.status(201).json(gift);
});

// PATCH /api/gifts/:id — update status / tracking
router.patch('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const gift = await prisma.giftOrder.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!gift) return res.status(404).json({ error: 'Gift order not found' });
    if (gift.agentId !== user.userId && !isManager(user)) return res.status(403).json({ error: 'Forbidden' });
    const data: any = {};
    if (STATUSES.includes(req.body.status)) data.status = req.body.status;
    if (typeof req.body.trackingNum === 'string') data.trackingNum = req.body.trackingNum;
    if (data.status === 'DELIVERED') data.deliveredAt = new Date();
    res.json(await prisma.giftOrder.update({ where: { id: gift.id }, data }));
});

export default router;
