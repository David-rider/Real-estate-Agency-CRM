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
            where: { id: String(req.params.id), userId: req.user.userId },
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
    const VALID = ['NEW_CLIENT', 'OFFER_RECEIVED', 'OFFER_ACCEPTED', 'OFFER_REJECTED', 'APPOINTMENT_REMINDER',
        'TRANSACTION_UPDATE', 'COMMISSION_PAID', 'TASK_DUE', 'DOCUMENT_SIGNED', 'SYSTEM'];
    try {
        await prisma.notification.create({
            data: {
                userId,
                orgId,
                type:     (VALID.includes(type) ? type : 'SYSTEM') as any,
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
