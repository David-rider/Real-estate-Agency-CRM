"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const router = (0, express_1.Router)();
// GET all properties (Paginated)
router.get('/', async (req, res) => {
    try {
        const authReq = req;
        const orgId = authReq.user?.orgId;
        if (!orgId)
            return res.status(401).json({ error: 'Unauthorized' });
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const skip = (page - 1) * limit;
        const [properties, total] = await Promise.all([
            server_1.prisma.property.findMany({
                where: { orgId },
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: { agent: { select: { name: true } } }
            }),
            server_1.prisma.property.count({ where: { orgId } })
        ]);
        res.json({
            data: properties,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});
// POST a new property
router.post('/', async (req, res) => {
    try {
        const { address, city, state, zip, price, beds, baths, sqft, status } = req.body;
        const authReq = req;
        if (!authReq.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const userId = authReq.user.userId;
        const orgId = authReq.user.orgId;
        const newProperty = await server_1.prisma.property.create({
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
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create property' });
    }
});
exports.default = router;
