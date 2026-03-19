import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all referrals for an org
router.get('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const referrals = await prisma.referral.findMany({
            where: { orgId },
            include: { referrer: true, referee: true }
        });
        res.json(referrals);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new referral
router.post('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const referrerId = (req as any).user?.id;
        const { refereeId, status } = req.body;
        const referral = await prisma.referral.create({
            data: { referrerId, refereeId, status: status || 'PENDING', orgId }
        });
        res.status(201).json(referral);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
