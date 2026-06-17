"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createNotification = createNotification;
const express_1 = require("express");
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
// GET /api/notifications
router.get('/', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const unreadOnly = req.query.unread === 'true';
        const limit = Math.min(50, parseInt(req.query.limit) || 20);
        const where = { userId: req.user.userId };
        if (unreadOnly)
            where.readAt = null;
        const [notifications, unreadCount] = await Promise.all([
            server_1.prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            server_1.prisma.notification.count({
                where: { userId: req.user.userId, readAt: null },
            }),
        ]);
        res.json({ notifications, unreadCount });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});
// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        await server_1.prisma.notification.updateMany({
            where: { id: String(req.params.id), userId: req.user.userId },
            data: { readAt: new Date() },
        });
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to mark notification read' });
    }
});
// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        await server_1.prisma.notification.updateMany({
            where: { userId: req.user.userId, readAt: null },
            data: { readAt: new Date() },
        });
        res.json({ ok: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Failed to mark all read' });
    }
});
// ─── Helper exported for use in other routes ──────────────────────────────────
async function createNotification(userId, orgId, type, title, message, link, metadata) {
    try {
        await server_1.prisma.notification.create({
            data: {
                userId,
                orgId,
                type: type,
                title,
                message,
                link,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });
    }
    catch (e) {
        console.error('Failed to create notification:', e);
    }
}
exports.default = router;
