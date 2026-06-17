"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
// GET /api/tasks
router.get('/', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const status = req.query.status;
        const priority = req.query.priority;
        const overdue = req.query.overdue === 'true';
        const where = { agentId: req.user.userId, orgId: req.user.orgId };
        if (status)
            where.status = status;
        if (priority)
            where.priority = priority;
        if (overdue)
            where.dueDate = { lt: new Date() };
        const tasks = await server_1.prisma.task.findMany({
            where,
            orderBy: [{ priority: 'desc' }, { dueDate: 'asc' }, { createdAt: 'desc' }],
        });
        res.json(tasks);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch tasks' });
    }
});
// POST /api/tasks
router.post('/', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { title, description, priority, dueDate, linkedClientId, linkedPropertyId, linkedTransactionId } = req.body;
        if (!title?.trim())
            return res.status(400).json({ error: 'Title is required' });
        const task = await server_1.prisma.task.create({
            data: {
                title: title.trim(),
                description,
                priority: priority || 'MEDIUM',
                dueDate: dueDate ? new Date(dueDate) : null,
                linkedClientId,
                linkedPropertyId,
                linkedTransactionId,
                agentId: req.user.userId,
                orgId: req.user.orgId,
            },
        });
        res.status(201).json(task);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create task' });
    }
});
// PATCH /api/tasks/:id
router.patch('/:id', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const existing = await server_1.prisma.task.findFirst({
            where: { id: String(req.params.id), agentId: req.user.userId },
        });
        if (!existing)
            return res.status(404).json({ error: 'Task not found' });
        const { title, description, status, priority, dueDate } = req.body;
        const data = {};
        if (title !== undefined)
            data.title = title;
        if (description !== undefined)
            data.description = description;
        if (status !== undefined)
            data.status = status;
        if (priority !== undefined)
            data.priority = priority;
        if (dueDate !== undefined)
            data.dueDate = dueDate ? new Date(dueDate) : null;
        if (status === 'COMPLETED')
            data.completedAt = new Date();
        if (status === 'PENDING' || status === 'IN_PROGRESS')
            data.completedAt = null;
        const updated = await server_1.prisma.task.update({ where: { id: String(req.params.id) }, data });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update task' });
    }
});
// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const existing = await server_1.prisma.task.findFirst({
            where: { id: String(req.params.id), agentId: req.user.userId },
        });
        if (!existing)
            return res.status(404).json({ error: 'Task not found' });
        await server_1.prisma.task.delete({ where: { id: String(req.params.id) } });
        res.json({ message: 'Task deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete task' });
    }
});
exports.default = router;
