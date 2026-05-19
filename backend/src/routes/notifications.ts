import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// GET /api/notifications
router.get('/', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const unreadOnly = req.query.unread === 'true';
        const limit = Math.min(50, parseInt(req.query.limit as string) || 20);

        const where: any = { userId: req.user.userId };
        if (unreadOnly) where.readAt = null;

        const [notifications, unreadCount] = await Promise.all([
            prisma.notification.findMany({
                where,
                orderBy: { createdAt: 'desc' },
                take: limit,
            }),
            prisma.notification.count({
                where: { userId: req.user.userId, readAt: null },
            }),
        ]);

        res.json({ notifications, unreadCount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.notification.updateMany({
            where: { id: req.params.id, userId: req.user.userId },
            data:  { readAt: new Date() },
        });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark notification read' });
    }
});

// PATCH /api/notifications/read-all — mark all as read
router.patch('/read-all', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        await prisma.notification.updateMany({
            where: { userId: req.user.userId, readAt: null },
            data:  { readAt: new Date() },
        });
        res.json({ ok: true });
    } catch (error) {
        res.status(500).json({ error: 'Failed to mark all read' });
    }
});

// ─── Helper exported for use in other routes ──────────────────────────────────
export async function createNotification(
    userId: string,
    orgId:  string,
    type:   string,
    title:  string,
    message: string,
    link?:  string,
    metadata?: object,
) {
    try {
        await prisma.notification.create({
            data: {
                userId,
                orgId,
                type:     type as any,
                title,
                message,
                link,
                metadata: metadata ? JSON.stringify(metadata) : null,
            },
        });
    } catch (e) {
        console.error('Failed to create notification:', e);
    }
}

export default router;
