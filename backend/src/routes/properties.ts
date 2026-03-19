import { Router } from 'express';
import { prisma } from '../server';

const router = Router();

// GET all properties (Paginated)
router.get('/', async (req, res) => {
    try {
        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        const orgId = authReq.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 12;
        const skip = (page - 1) * limit;

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where: { orgId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { agent: { select: { name: true } } }
            }),
            prisma.property.count({ where: { orgId } })
        ]);

        res.json({
            data: properties,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// POST a new property
router.post('/', async (req, res) => {
    try {
        const { address, city, state, zip, price, beds, baths, sqft, status } = req.body;

        const authReq = req as import('../middleware/authMiddleware').AuthRequest;
        if (!authReq.user) return res.status(401).json({ error: 'Unauthorized' });
        const userId = authReq.user.userId;
        const orgId = authReq.user.orgId;

        const newProperty = await prisma.property.create({
            data: {
                address,
                city,
                state,
                zip,
                price: parseFloat(price),
                beds: parseFloat(beds),
                baths: parseFloat(baths),
                sqft: sqft ? parseInt(sqft) : null,
                status: status || 'ACTIVE',
                agentId: userId,
                orgId: orgId
            }
        });

        res.status(201).json(newProperty);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create property' });
    }
});

export default router;
