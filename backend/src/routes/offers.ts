import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

// GET /api/offers
router.get('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.userId;

        if (!orgId || !userId) return res.status(401).json({ error: 'Unauthorized' });

        const offers = await prisma.offer.findMany({
            where: { orgId, agentId: userId },
            include: { property: true, client: true }
        });

        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});

// POST /api/offers
router.post('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        const agentId = req.user?.userId;

        if (!orgId || !agentId) return res.status(401).json({ error: 'Unauthorized' });

        const { amount, propertyId, clientId } = req.body;

        const newOffer = await prisma.offer.create({
            data: {
                amount: parseFloat(amount),
                propertyId,
                clientId,
                agentId,
                orgId,
                status: 'PENDING'
            }
        });

        res.status(201).json(newOffer);
    } catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
});

export default router;
