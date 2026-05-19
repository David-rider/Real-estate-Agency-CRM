import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();

// All property routes require auth
router.use(authenticateToken);

// GET /api/properties — paginated list with filters
router.get('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const page    = Math.max(1, parseInt(req.query.page  as string) || 1);
        const limit   = Math.min(100, parseInt(req.query.limit as string) || 12);
        const skip    = (page - 1) * limit;
        const search  = (req.query.search as string)?.trim() || '';
        const status  = req.query.status as string;
        const type    = req.query.type as string;
        const agentId = req.query.agentId as string;

        const where: any = { orgId };
        if (status) where.status = status;
        if (type)   where.propertyType = type;
        if (agentId) where.agentId = agentId;
        if (search) {
            where.OR = [
                { address:      { contains: search, mode: 'insensitive' } },
                { city:         { contains: search, mode: 'insensitive' } },
                { neighborhood: { contains: search, mode: 'insensitive' } },
                { mlsNumber:    { contains: search, mode: 'insensitive' } },
            ];
        }

        const [properties, total] = await Promise.all([
            prisma.property.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    agent:       { select: { id: true, name: true, avatarUrl: true } },
                    mediaAssets: { take: 1, orderBy: { sortOrder: 'asc' } },
                    _count:      { select: { offers: true, appointments: true } },
                },
            }),
            prisma.property.count({ where }),
        ]);

        res.json({ data: properties, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch properties' });
    }
});

// GET /api/properties/:id — single property with full details
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const property = await prisma.property.findFirst({
            where: { id: req.params.id, orgId },
            include: {
                agent:        { select: { id: true, name: true, email: true, phone: true, avatarUrl: true } },
                mediaAssets:  { orderBy: { sortOrder: 'asc' } },
                transactions: {
                    include: { client: { select: { firstName: true, lastName: true } } },
                    orderBy:  { createdAt: 'desc' },
                },
                offers: {
                    include: { client: { select: { firstName: true, lastName: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                appointments: {
                    where:   { status: { not: 'CANCELLED' } },
                    orderBy: { date: 'asc' },
                },
                propertyNotes: {
                    include: { author: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!property) return res.status(404).json({ error: 'Property not found' });
        res.json(property);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch property' });
    }
});

// POST /api/properties — create property
router.post('/', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { address, city, state, zip, price, beds, baths, sqft, status,
                description, propertyType, neighborhood, yearBuilt, mlsNumber,
                hoaFee, parkingSpaces, virtualTourUrl, listingDate } = req.body;

        const property = await prisma.property.create({
            data: {
                address, city, state, zip,
                price:         parseFloat(price),
                beds:          parseFloat(beds),
                baths:         parseFloat(baths),
                sqft:          sqft          ? parseInt(sqft)          : null,
                yearBuilt:     yearBuilt     ? parseInt(yearBuilt)     : null,
                parkingSpaces: parkingSpaces ? parseInt(parkingSpaces) : null,
                hoaFee:        hoaFee        ? parseFloat(hoaFee)      : null,
                description,
                status:        status || 'ACTIVE',
                propertyType,
                neighborhood,
                mlsNumber,
                virtualTourUrl,
                listingDate:   listingDate ? new Date(listingDate) : null,
                agentId:       req.user.userId,
                orgId:         req.user.orgId,
            },
        });

        res.status(201).json(property);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create property' });
    }
});

// PATCH /api/properties/:id — update property
router.patch('/:id', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        // Verify ownership (agents can only edit own; managers can edit org)
        const existing = await prisma.property.findFirst({
            where: { id: req.params.id, orgId: req.user.orgId },
        });
        if (!existing) return res.status(404).json({ error: 'Property not found' });

        const canEdit = existing.agentId === req.user.userId ||
            ['FIRMADMIN', 'SUPERADMIN', 'MANAGER'].includes(req.user.role);
        if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

        const allowed = [
            'address','city','state','zip','price','beds','baths','sqft','description',
            'status','propertyType','neighborhood','yearBuilt','mlsNumber','hoaFee',
            'parkingSpaces','virtualTourUrl','featuredImage','featured','listingDate','expirationDate',
        ];
        const data: any = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) data[key] = req.body[key];
        }
        if (data.price)         data.price         = parseFloat(data.price);
        if (data.beds)          data.beds           = parseFloat(data.beds);
        if (data.baths)         data.baths          = parseFloat(data.baths);
        if (data.sqft)          data.sqft           = parseInt(data.sqft);
        if (data.yearBuilt)     data.yearBuilt      = parseInt(data.yearBuilt);
        if (data.parkingSpaces) data.parkingSpaces  = parseInt(data.parkingSpaces);
        if (data.hoaFee)        data.hoaFee         = parseFloat(data.hoaFee);
        if (data.listingDate)   data.listingDate    = new Date(data.listingDate);

        const updated = await prisma.property.update({ where: { id: req.params.id }, data });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update property' });
    }
});

// DELETE /api/properties/:id — soft-delete (set status to WITHDRAWN)
router.delete('/:id', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const existing = await prisma.property.findFirst({
            where: { id: req.params.id, orgId: req.user.orgId },
        });
        if (!existing) return res.status(404).json({ error: 'Property not found' });

        const canDelete = existing.agentId === req.user.userId ||
            ['FIRMADMIN', 'SUPERADMIN', 'MANAGER'].includes(req.user.role);
        if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

        await prisma.property.update({
            where: { id: req.params.id },
            data:  { status: 'WITHDRAWN' },
        });
        res.json({ message: 'Property withdrawn' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

export default router;
