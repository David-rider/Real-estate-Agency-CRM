import express from 'express';
import { prisma } from '../server';

const router = express.Router();

// Get all gift orders for an org
router.get('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const gifts = await prisma.giftOrder.findMany({
            where: { orgId },
            include: { client: true, agent: true }
        });
        res.json(gifts);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new gift order
router.post('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const agentId = (req as any).user?.id;
        const { item, clientId, status } = req.body;
        const gift = await prisma.giftOrder.create({
            data: { item, clientId, agentId, status: status || 'ORDERED', orgId }
        });
        res.status(201).json(gift);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
