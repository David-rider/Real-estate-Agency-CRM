import express from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/documents
router.get('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.userId;

        if (!orgId || !userId) return res.status(401).json({ error: 'Unauthorized' });

        const documents = await prisma.document.findMany({
            where: {
                orgId,
                transaction: {
                    agentId: userId
                }
            },
            include: { transaction: true }
        });

        res.json(documents);
    } catch (error) {
        console.error('Error fetching documents:', error);
        res.status(500).json({ error: 'Failed to fetch documents' });
    }
});

// POST /api/documents
router.post('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;

        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const { name, url, type, transactionId } = req.body;

        const newDoc = await prisma.document.create({
            data: {
                name,
                url,
                type,
                transactionId,
                orgId
            }
        });

        res.status(201).json(newDoc);
    } catch (error) {
        console.error('Error creating document:', error);
        res.status(500).json({ error: 'Failed to create document' });
    }
});

export default router;
