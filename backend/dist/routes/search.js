"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
// GET /api/search?q=...
// Returns clients, properties, transactions matching the query
router.get('/', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const q = req.query.q?.trim();
        if (!q || q.length < 2)
            return res.json({ clients: [], properties: [], transactions: [] });
        const orgId = req.user.orgId;
        const mode = 'insensitive';
        const LIMIT = 5;
        const [clients, properties, transactions] = await Promise.all([
            server_1.prisma.client.findMany({
                where: {
                    orgId,
                    OR: [
                        { firstName: { contains: q, mode } },
                        { lastName: { contains: q, mode } },
                        { email: { contains: q, mode } },
                        { phone: { contains: q, mode } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, funnelStage: true },
                take: LIMIT,
            }),
            server_1.prisma.property.findMany({
                where: {
                    orgId,
                    OR: [
                        { address: { contains: q, mode } },
                        { city: { contains: q, mode } },
                        { neighborhood: { contains: q, mode } },
                        { mlsNumber: { contains: q, mode } },
                    ],
                },
                select: { id: true, address: true, city: true, state: true, price: true, status: true, beds: true, baths: true },
                take: LIMIT,
            }),
            server_1.prisma.transaction.findMany({
                where: {
                    orgId,
                    OR: [
                        { property: { address: { contains: q, mode } } },
                        { client: { firstName: { contains: q, mode } } },
                        { client: { lastName: { contains: q, mode } } },
                    ],
                },
                include: {
                    property: { select: { address: true, city: true } },
                    client: { select: { firstName: true, lastName: true } },
                },
                take: LIMIT,
            }),
        ]);
        res.json({
            clients,
            properties,
            transactions: transactions.map(t => ({
                id: t.id,
                status: t.status,
                price: t.price,
                property: t.property,
                client: t.client,
            })),
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
});
exports.default = router;
