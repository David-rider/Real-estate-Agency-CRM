"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// GET /api/properties/public — unauthenticated public listings showcase
// Returns active properties across all orgs (for public listings portal)
router.get('/public', async (_req, res) => {
    try {
        const properties = await server_1.prisma.property.findMany({
            where: { status: 'ACTIVE' },
            take: 24,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                address: true,
                city: true,
                state: true,
                zip: true,
                price: true,
                beds: true,
                baths: true,
                sqft: true,
                status: true,
                mediaAssets: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
            },
        });
        const result = properties.map(p => ({
            id: p.id,
            address: p.address,
            city: p.city,
            state: p.state,
            zip: p.zip,
            price: p.price,
            beds: p.beds,
            baths: p.baths,
            sqft: p.sqft,
            status: p.status,
            imageUrl: p.mediaAssets[0]?.url ?? null,
        }));
        res.json(result);
    }
    catch (error) {
        console.error('Public listings error:', error);
        res.status(500).json({ error: 'Failed to fetch public listings' });
    }
});
// All other property routes require auth
router.use(authMiddleware_1.authenticateToken);
// GET /api/properties — paginated list with filters
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ error: 'Unauthorized' });
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, parseInt(req.query.limit) || 12);
        const skip = (page - 1) * limit;
        const search = req.query.search?.trim() || '';
        const status = req.query.status;
        const type = req.query.type;
        const agentId = req.query.agentId;
        const where = { orgId };
        if (status)
            where.status = status;
        if (type)
            where.propertyType = type;
        if (agentId)
            where.agentId = agentId;
        if (search) {
            where.OR = [
                { address: { contains: search, mode: 'insensitive' } },
                { city: { contains: search, mode: 'insensitive' } },
                { neighborhood: { contains: search, mode: 'insensitive' } },
                { mlsNumber: { contains: search, mode: 'insensitive' } },
            ];
        }
        const [properties, total] = await Promise.all([
            server_1.prisma.property.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    agent: { select: { id: true, name: true, avatarUrl: true } },
                    mediaAssets: { take: 1, orderBy: { sortOrder: 'asc' } },
                    _count: { select: { offers: true, appointments: true } },
                },
            }),
            server_1.prisma.property.count({ where }),
        ]);
        res.json({ data: properties, total, page, limit, totalPages: Math.ceil(total / limit) });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});
// GET /api/properties/:id — single property with full details
router.get('/:id', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId)
            return res.status(401).json({ error: 'Unauthorized' });
        const property = await server_1.prisma.property.findFirst({
            where: { id: String(req.params.id), orgId },
            include: {
                agent: { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
                mediaAssets: { orderBy: { sortOrder: 'asc' } },
                transactions: {
                    include: { client: { select: { firstName: true, lastName: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                offers: {
                    include: { client: { select: { firstName: true, lastName: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                appointments: {
                    where: { status: { not: 'CANCELLED' } },
                    orderBy: { date: 'asc' },
                },
                propertyNotes: {
                    include: { author: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });
        if (!property)
            return res.status(404).json({ error: 'Property not found' });
        res.json(property);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
});
// POST /api/properties — create property
router.post('/', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { address, city, state, zip, price, beds, baths, sqft, status, description, propertyType, neighborhood, yearBuilt, mlsNumber, hoaFee, parkingSpaces, virtualTourUrl, listingDate } = req.body;
        const property = await server_1.prisma.property.create({
            data: {
                address, city, state, zip,
                price: parseFloat(price),
                beds: parseFloat(beds),
                baths: parseFloat(baths),
                sqft: sqft ? parseInt(sqft) : null,
                yearBuilt: yearBuilt ? parseInt(yearBuilt) : null,
                parkingSpaces: parkingSpaces ? parseInt(parkingSpaces) : null,
                hoaFee: hoaFee ? parseFloat(hoaFee) : null,
                description,
                status: status || 'ACTIVE',
                propertyType,
                neighborhood,
                mlsNumber,
                virtualTourUrl,
                listingDate: listingDate ? new Date(listingDate) : null,
                agentId: req.user.userId,
                orgId: req.user.orgId,
            },
        });
        res.status(201).json(property);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create property' });
    }
});
// PATCH /api/properties/:id — update property
router.patch('/:id', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Verify ownership (agents can only edit own; managers can edit org)
        const existing = await server_1.prisma.property.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!existing)
            return res.status(404).json({ error: 'Property not found' });
        const canEdit = existing.agentId === req.user.userId ||
            ['FIRMADMIN', 'SUPERADMIN', 'MANAGER'].includes(req.user.role);
        if (!canEdit)
            return res.status(403).json({ error: 'Forbidden' });
        const allowed = [
            'address', 'city', 'state', 'zip', 'price', 'beds', 'baths', 'sqft', 'description',
            'status', 'propertyType', 'neighborhood', 'yearBuilt', 'mlsNumber', 'hoaFee',
            'parkingSpaces', 'virtualTourUrl', 'featuredImage', 'featured', 'listingDate', 'expirationDate',
        ];
        const data = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined)
                data[key] = req.body[key];
        }
        if (data.price)
            data.price = parseFloat(data.price);
        if (data.beds)
            data.beds = parseFloat(data.beds);
        if (data.baths)
            data.baths = parseFloat(data.baths);
        if (data.sqft)
            data.sqft = parseInt(data.sqft);
        if (data.yearBuilt)
            data.yearBuilt = parseInt(data.yearBuilt);
        if (data.parkingSpaces)
            data.parkingSpaces = parseInt(data.parkingSpaces);
        if (data.hoaFee)
            data.hoaFee = parseFloat(data.hoaFee);
        if (data.listingDate)
            data.listingDate = new Date(data.listingDate);
        const updated = await server_1.prisma.property.update({ where: { id: String(req.params.id) }, data });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});
// DELETE /api/properties/:id — soft-delete (set status to WITHDRAWN)
router.delete('/:id', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const existing = await server_1.prisma.property.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!existing)
            return res.status(404).json({ error: 'Property not found' });
        const canDelete = existing.agentId === req.user.userId ||
            ['FIRMADMIN', 'SUPERADMIN', 'MANAGER'].includes(req.user.role);
        if (!canDelete)
            return res.status(403).json({ error: 'Forbidden' });
        await server_1.prisma.property.update({
            where: { id: String(req.params.id) },
            data: { status: 'WITHDRAWN' },
        });
        res.json({ message: 'Property withdrawn' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});
exports.default = router;
