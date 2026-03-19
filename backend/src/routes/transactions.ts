import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// GET all transactions
router.get('/', async (req, res) => {
    try {
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        const orgId = authReq.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const transactions = await prisma.transaction.findMany({
            where: { orgId },
            include: {
                client: true,
                property: true
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// POST a new transaction
router.post('/', async (req, res) => {
    try {
        const { propertyId, clientId, price, status } = req.body;

        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        if (!authReq.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = authReq.user.userId;
        const orgId = authReq.user.orgId;

        const newTransaction = await prisma.transaction.create({
            data: {
                propertyId,
                clientId,
                price: parseFloat(price),
                status: status || 'OFFER_REVIEW',
                agentId: userId,
                orgId: orgId
            }
        });

        res.status(201).json(newTransaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

export default router;
