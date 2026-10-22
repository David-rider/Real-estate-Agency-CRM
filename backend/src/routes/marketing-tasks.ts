import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { isManager, optDate } from '../lib/access';

const router = express.Router();
const STATUSES = ['PENDING', 'IN_PROGRESS', 'COMPLETED', 'PUBLISHED', 'ARCHIVED'];

// GET /api/marketing-tasks
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const where: any = { orgId: user.orgId };
    if (!isManager(user) && user.role !== 'MARKETING') where.agentId = user.userId;
    res.json(await prisma.marketingTask.findMany({ where, orderBy: { createdAt: 'desc' }, take: 200 }));
});

// POST /api/marketing-tasks — save generated copy / plan a post
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const title = typeof req.body.title === 'string' ? req.body.title.trim() : '';
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const task = await prisma.marketingTask.create({
        data: {
            title,
            content: typeof req.body.content === 'string' ? req.body.content : null,
            channel: typeof req.body.channel === 'string' ? req.body.channel : null,
            scheduledAt: optDate(req.body.scheduledAt) ?? null,
            status: STATUSES.includes(req.body.status) ? req.body.status : 'PENDING',
            agentId: user.userId,
            orgId: user.orgId,
        },
    });
    res.status(201).json(task);
});

// PATCH /api/marketing-tasks/:id
router.patch('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const task = await prisma.marketingTask.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (task.agentId !== user.userId && !isManager(user) && user.role !== 'MARKETING') return res.status(403).json({ error: 'Forbidden' });
    const data: any = {};
    if (typeof req.body.title === 'string' && req.body.title.trim()) data.title = req.body.title.trim();
    if (typeof req.body.content === 'string') data.content = req.body.content;
    if (STATUSES.includes(req.body.status)) data.status = req.body.status;
    if (data.status === 'PUBLISHED') data.publishedAt = new Date();
    res.json(await prisma.marketingTask.update({ where: { id: task.id }, data }));
});

// DELETE /api/marketing-tasks/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const task = await prisma.marketingTask.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!task) return res.status(404).json({ error: 'Not found' });
    if (task.agentId !== user.userId && !isManager(user)) return res.status(403).json({ error: 'Forbidden' });
    await prisma.marketingTask.delete({ where: { id: task.id } });
    res.json({ message: 'Deleted' });
});

export default router;
