"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// GET /api/settings/users - List all users
router.get('/users', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = req.user.orgId;
        const users = await server_1.prisma.user.findMany({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
// PUT /api/settings/users/:id/role - Update user role and tier
router.put('/users/:id/role', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const id = req.params.id;
        const { role, tier } = req.body;
        const updatedUser = await server_1.prisma.user.update({
            where: { id },
            data: { role, tier },
            select: {
                id: true,
                name: true,
                role: true,
                tier: true,
            }
        });
        res.json(updatedUser);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
exports.default = router;
