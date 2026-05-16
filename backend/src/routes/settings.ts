import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest, authorizeRole } from '../middleware/authMiddleware';

const router = Router();

// GET /api/settings/users - List all users
router.get('/users', authorizeRole(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const orgId = req.user.orgId;
        const users = await prisma.user.findMany({
            where: { orgId },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                tier: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PUT /api/settings/users/:id/role - Update user role and tier
router.put('/users/:id/role', authorizeRole(['SUPERADMIN', 'FIRMADMIN']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const id = req.params.id as string;
        const { role, tier } = req.body;

        const updatedUser = await prisma.user.update({
            where: { id, orgId: req.user.orgId },
            data: { role, tier },
            select: {
                id: true,
                name: true,
                role: true,
                tier: true,
            }
        });

        res.json(updatedUser);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

export default router;
