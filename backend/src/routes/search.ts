import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// GET /api/search?q=...
// Returns clients, properties, transactions matching the query
router.get('/', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const q = (req.query.q as string)?.trim();
        if (!q || q.length < 2) return res.json({ clients: [], properties: [], transactions: [] });

        const orgId = req.user.orgId;
        const mode  = 'insensitive' as const;
        const LIMIT = 5;

        const [clients, properties, transactions] = await Promise.all([
            prisma.client.findMany({
                where: {
                    orgId,
                    OR: [
                        { firstName: { contains: q, mode } },
                        { lastName:  { contains: q, mode } },
                        { email:     { contains: q, mode } },
                        { phone:     { contains: q, mode } },
                    ],
                },
                select: { id: true, firstName: true, lastName: true, email: true, phone: true, funnelStage: true },
                take: LIMIT,
            }),
            prisma.property.findMany({
                where: {
                    orgId,
                    OR: [
                        { address:      { contains: q, mode } },
                        { city:         { contains: q, mode } },
                        { neighborhood: { contains: q, mode } },
                        { mlsNumber:    { contains: q, mode } },
                    ],
                },
                select: { id: true, address: true, city: true, state: true, price: true, status: true, beds: true, baths: true },
                take: LIMIT,
            }),
            prisma.transaction.findMany({
                where: {
                    orgId,
                    OR: [
                        { property: { address: { contains: q, mode } } },
                        { client:   { firstName: { contains: q, mode } } },
                        { client:   { lastName:  { contains: q, mode } } },
                    ],
                },
                include: {
                    property: { select: { address: true, city: true } },
                    client:   { select: { firstName: true, lastName: true } },
                },
                take: LIMIT,
            }),
        ]);

        res.json({
            clients,
            properties,
            transactions: transactions.map(t => ({
                id:       t.id,
                status:   t.status,
                price:    t.price,
                property: t.property,
                client:   t.client,
            })),
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Search failed' });
    }
});

export default router;
