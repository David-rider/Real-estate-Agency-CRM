import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { checkRefs, optDate, pickEnum } from '../lib/access';

const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
const PRIORITIES = ['LOW', 'MEDIUM', 'HIGH', 'URGENT'] as const;

const router = Router();
router.use(authenticateToken);

// GET /api/tasks
router.get('/', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const status   = pickEnum(req.query.status, STATUSES);
        const priority = pickEnum(req.query.priority, PRIORITIES);
        const overdue  = req.query.overdue  === 'true';

        const where: any = { agentId: req.user.userId, orgId: req.user.orgId };
        if (status)   where.status   = status;
        if (priority) where.priority = priority;
        if (overdue)  { where.dueDate = { lt: new Date() }; if (!status) where.status = { in: ['PENDING', 'IN_PROGRESS'] }; }
        if (typeof req.query.clientId === 'string')      where.linkedClientId = req.query.clientId;
        if (typeof req.query.transactionId === 'string') where.linkedTransactionId = req.query.transactionId;

        const tasks = await prisma.task.findMany({
            where,
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        });

        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});

// POST /api/tasks
router.post('/', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { title, description, priority, dueDate, linkedClientId, linkedPropertyId, linkedTransactionId } = req.body;
        if (typeof title !== 'string' || !title.trim()) return res.status(400).json({ error: 'Title is required' });
        const refErr = await checkRefs(req.user.orgId, {
            clientId: linkedClientId || null, propertyId: linkedPropertyId || null, transactionId: linkedTransactionId || null,
        });
        if (refErr) return res.status(400).json({ error: refErr });

        const task = await prisma.task.create({
            data: {
                title:               title.trim(),
                description,
                priority:            pickEnum(priority, PRIORITIES) ?? 'MEDIUM',
                dueDate:             optDate(dueDate) ?? null,
                linkedClientId:      linkedClientId || null,
                linkedPropertyId:    linkedPropertyId || null,
                linkedTransactionId: linkedTransactionId || null,
                agentId:             req.user.userId,
                orgId:               req.user.orgId,
            },
        });
        res.status(201).json(task);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});

// PATCH /api/tasks/:id
router.patch('/:id', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const existing = await prisma.task.findFirst({
            where: { id: String(req.params.id), agentId: req.user.userId, orgId: req.user.orgId },
        });
        if (!existing) return res.status(404).json({ error: 'Task not found' });

        const { title, description, status, priority, dueDate } = req.body;
        const data: any = {};
        if (title       !== undefined) data.title       = title;
        if (description !== undefined) data.description = description;
        if (status !== undefined) {
            if (!pickEnum(status, STATUSES)) return res.status(400).json({ error: 'Invalid status' });
            data.status = status;
        }
        if (priority !== undefined) {
            if (!pickEnum(priority, PRIORITIES)) return res.status(400).json({ error: 'Invalid priority' });
            data.priority = priority;
        }
        if (dueDate !== undefined) data.dueDate = optDate(dueDate) ?? null;
        if (data.title !== undefined && (typeof data.title !== 'string' || !data.title.trim())) {
            return res.status(400).json({ error: 'Title cannot be empty' });
        }
        if (status === 'COMPLETED')    data.completedAt = new Date();
        if (status === 'PENDING' || status === 'IN_PROGRESS') data.completedAt = null;

        const updated = await prisma.task.update({ where: { id: String(req.params.id) }, data });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const existing = await prisma.task.findFirst({
            where: { id: String(req.params.id), agentId: req.user.userId, orgId: req.user.orgId },
        });
        if (!existing) return res.status(404).json({ error: 'Task not found' });

        await prisma.task.delete({ where: { id: String(req.params.id) } });
        res.json({ message: 'Task deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});

export default router;
