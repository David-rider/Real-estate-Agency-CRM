import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// GET all clients (Paginated)
router.get('/', async (req, res) => {
    try {
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        const orgId = authReq.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const skip = (page - 1) * limit;

        const [clients, total] = await Promise.all([
            prisma.client.findMany({
                where: { orgId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { agent: { select: { name: true } } }
            }),
            prisma.client.count({ where: { orgId } })
        ]);

        res.json({
            data: clients,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch clients' });
    }
});

// POST a new client
router.post('/', async (req, res) => {
    try {
        const { firstName, lastName, email, phone, type, targetMoveDate, funnelStage, status, budget } = req.body;
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        if (!authReq.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const userId = authReq.user.userId;
        const orgId = authReq.user.orgId;

        const newClient = await prisma.client.create({
            data: {
                firstName,
                lastName,
                email,
                phone,
                type: type || 'BUYER',
                targetMoveDate: targetMoveDate ? new Date(targetMoveDate) : null,
                funnelStage: funnelStage || 'LEAD',
                status: status || 'ACTIVE',
                budget: budget || null,
                agentId: userId,
                orgId: orgId
            }
        });

        res.status(201).json(newClient);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create client' });
    }
});

// GET a client's timeline/history
router.get('/:id/timeline', async (req, res) => {
    try {
        const { id } = req.params;
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        const orgId = authReq.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const [client, offers, appointments, giftOrders, transactions] = await Promise.all([
            prisma.client.findFirst({ where: { id, orgId } }),
            prisma.offer.findMany({ where: { clientId: id, orgId }, include: { property: true } }),
            prisma.appointment.findMany({ where: { clientId: id, orgId }, include: { property: true } }),
            prisma.giftOrder.findMany({ where: { clientId: id, orgId } }),
            prisma.transaction.findMany({ where: { clientId: id, orgId }, include: { property: true } })
        ]);

        if (!client) return res.status(404).json({ error: 'Client not found' });

        // Map activities to a common timeline format
        const events = [
            ...offers.map(o => ({
                id: o.id,
                type: 'OFFER',
                title: `Offer submitted for ${o.property.address}`,
                description: `$${o.amount.toLocaleString()} - ${o.status}`,
                date: o.createdAt,
                status: o.status
            })),
            ...appointments.map(a => ({
                id: a.id,
                type: 'APPOINTMENT',
                title: `Appointment: ${a.title}`,
                description: a.property ? `At ${a.property.address}` : 'General meeting',
                date: a.date,
                status: a.status
            })),
            ...giftOrders.map(g => ({
                id: g.id,
                type: 'GIFT',
                title: `Gift Ordered: ${g.item}`,
                description: `Status: ${g.status}`,
                date: g.createdAt,
                status: g.status
            })),
            ...transactions.map(t => ({
                id: t.id,
                type: 'TRANSACTION',
                title: `Transaction Status: ${t.status}`,
                description: `Property: ${t.property.address}`,
                date: t.updatedAt,
                status: t.status
            })),
            {
                id: `creation-${client.id}`,
                type: 'MODIFICATION',
                title: 'Client Record Created',
                description: `Added as ${client.type}`,
                date: client.createdAt
            }
        ];

        // Sort by date descending
        events.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        res.json(events);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch client timeline' });
    }
});

// PATCH update client details
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { firstName, lastName, email, phone, budget, funnelStage, type, status } = req.body;
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        const orgId = authReq.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const updatedClient = await prisma.client.updateMany({
            where: { id, orgId },
            data: {
                firstName,
                lastName,
                email,
                phone,
                budget,
                funnelStage,
                type,
                status
            }
        });

        if (updatedClient.count === 0) return res.status(404).json({ error: 'Client not found' });

        const client = await prisma.client.findFirst({ where: { id, orgId } });
        res.json(client);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update client' });
    }
});

// POST a manual activity (note/call/meeting)
// We reuse the Appointment model with status='COMPLETED' to represent history
router.post('/:id/activities', async (req, res) => {
    try {
        const { id } = req.params;
        const { type, content, subject } = req.body; // type: 'NOTE' | 'CALL' | 'MEETING'
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        if (!authReq.user) return res.status(401).json({ error: 'Unauthorized' });

        // Security check: verify the client exists and belongs to the user's organization
        const client = await prisma.client.findFirst({
            where: { id, orgId: authReq.user.orgId }
        });

        if (!client) {
            return res.status(404).json({ error: 'Client not found or access denied' });
        }

        const newActivity = await prisma.appointment.create({
            data: {
                title: `${type}: ${subject || 'Manual Entry'}`,
                notes: content,
                date: new Date(),
                status: 'COMPLETED',
                clientId: id,
                agentId: authReq.user.userId,
                orgId: authReq.user.orgId
            }
        });

        res.status(201).json(newActivity);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to log activity' });
    }
});

export default router;
