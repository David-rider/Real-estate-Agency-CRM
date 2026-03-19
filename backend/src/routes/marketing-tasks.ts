import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all marketing tasks for an org
router.get('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const tasks = await prisma.marketingTask.findMany({
            where: { orgId }
        });
        res.json(tasks);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new marketing task
router.post('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const agentId = (req as any).user?.id;
        const { title, content, status } = req.body;
        const task = await prisma.marketingTask.create({
            data: { title, content, status: status || 'PENDING', agentId, orgId }
        });
        res.status(201).json(task);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
