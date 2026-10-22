import { Router } from 'express';
import { prisma } from '../server';
import rateLimit from 'express-rate-limit';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';
import { optDate, optNumber } from '../lib/access';
import { createNotification } from './notifications';

const router = Router();

const PROP_STATUSES = ['COMING_SOON', 'ACTIVE', 'IN_CONTRACT', 'SOLD', 'WITHDRAWN', 'EXPIRED'];

// Public lead forms are unauthenticated — keep bots from flooding agents' CRMs
const inquiryLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});

const PUBLIC_SELECT = {
    id: true, address: true, city: true, state: true, zip: true, price: true, beds: true, baths: true,
    sqft: true, status: true, description: true, propertyType: true, neighborhood: true, yearBuilt: true,
    virtualTourUrl: true,
    mediaAssets: { orderBy: { sortOrder: 'asc' as const }, select: { url: true, type: true, caption: true } },
    agent: { select: { name: true, phone: true, email: true, title: true } },
    organization: { select: { name: true, phone: true, slug: true } },
};

// GET /api/properties/public?b=<brokerage-slug> — one brokerage's public listings page.
// Each brokerage only ever shows its own listings.
router.get('/public', async (req, res) => {
    const slug = typeof req.query.b === 'string' ? req.query.b.trim().toLowerCase() : '';
    if (!slug) return res.status(400).json({ error: 'Brokerage not specified' });

    const organization = await prisma.organization.findUnique({
        where: { slug },
        select: { id: true, name: true, slug: true, phone: true, website: true, logoUrl: true },
    });
    if (!organization) return res.status(404).json({ error: 'Brokerage not found' });

    const properties = await prisma.property.findMany({
        where: { orgId: organization.id, status: { in: ['ACTIVE', 'COMING_SOON', 'IN_CONTRACT'] } },
        take: 100,
        orderBy: [{ featured: 'desc' }, { createdAt: 'desc' }],
        select: {
            id: true, address: true, city: true, state: true, zip: true, price: true,
            beds: true, baths: true, sqft: true, status: true,
            mediaAssets: { take: 1, orderBy: { sortOrder: 'asc' }, select: { url: true } },
        },
    });

    const { id: _orgId, ...org } = organization;
    res.json({
        organization: org,
        listings: properties.map(({ mediaAssets, ...p }) => ({ ...p, imageUrl: mediaAssets[0]?.url ?? null })),
    });
});

// GET /api/properties/public/:id — public listing page
router.get('/public/:id', async (req, res) => {
    const property = await prisma.property.findFirst({
        where: { id: String(req.params.id), status: { in: ['ACTIVE', 'COMING_SOON', 'IN_CONTRACT'] } },
        select: PUBLIC_SELECT,
    });
    if (!property) return res.status(404).json({ error: 'Listing not found' });
    res.json(property);
});

// POST /api/properties/public/:id/inquiry — website / open-house lead capture.
// Creates (or updates) a HOT lead for the listing agent, logs the message,
// and drops a "call back now" task — speed-to-lead matters most.
router.post('/public/:id/inquiry', inquiryLimiter, async (req, res) => {
    const clean = (v: unknown, max = 200) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
    const name = clean(req.body.name, 120);
    const email = clean(req.body.email, 200).toLowerCase();
    const phone = clean(req.body.phone, 40);
    const message = clean(req.body.message, 2000);
    const source = req.body.source === 'OPEN_HOUSE' ? 'Open House' : 'Website';
    // Honeypot field: real users never fill it in
    if (clean(req.body.website)) return res.status(201).json({ ok: true });

    if (!name) return res.status(400).json({ error: 'Please enter your name' });
    if (!email && !phone) return res.status(400).json({ error: 'Please enter an email or phone number' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email address' });

    const property = await prisma.property.findFirst({
        where: { id: String(req.params.id), status: { in: ['ACTIVE', 'COMING_SOON', 'IN_CONTRACT'] } },
    });
    if (!property) return res.status(404).json({ error: 'Listing not found' });

    const [firstName, ...rest] = name.split(/\s+/);
    const or: any[] = [];
    if (email) or.push({ email: { equals: email, mode: 'insensitive' } });
    if (phone) or.push({ phone });
    let client = await prisma.client.findFirst({ where: { orgId: property.orgId, OR: or } });
    const isNew = !client;
    if (!client) {
        client = await prisma.client.create({
            data: {
                firstName, lastName: rest.join(' '),
                email: email || null, phone: phone || null,
                type: 'BUYER', status: 'LEAD', funnelStage: 'LEAD', temperature: 'HOT',
                source, agentId: property.agentId, orgId: property.orgId,
            },
        });
    } else {
        await prisma.client.update({ where: { id: client.id }, data: { temperature: 'HOT' } });
    }

    await prisma.note.create({
        data: {
            type: 'NOTE',
            content: `${source} inquiry about ${property.address}${message ? `:\n${message}` : ''}`,
            clientId: client.id, propertyId: property.id,
            authorId: property.agentId, orgId: property.orgId,
        },
    });
    await prisma.task.create({
        data: {
            title: `Call back ${name} about ${property.address}`,
            priority: 'URGENT', dueDate: new Date(Date.now() + 15 * 60 * 1000),
            linkedClientId: client.id, linkedPropertyId: property.id,
            agentId: property.agentId, orgId: property.orgId,
        },
    });
    await createNotification(
        property.agentId, property.orgId, 'NEW_CLIENT',
        isNew ? `New ${source.toLowerCase()} lead` : `Returning lead: ${name}`,
        `${name} asked about ${property.address}. Reach out within 5 minutes.`,
        `/crm/${client.id}`,
    );
    res.status(201).json({ ok: true });
});

// All other property routes require auth
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
            where: { id: String(req.params.id), orgId },
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

        if (!['SUPERADMIN', 'FIRMADMIN', 'MANAGER', 'AGENT'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Your role cannot create listings' });
        }
        for (const [k, v] of Object.entries({ address, city, state, zip })) {
            if (typeof v !== 'string' || !v.trim()) return res.status(400).json({ error: `${k} is required` });
        }
        if (virtualTourUrl && !/^https?:\/\//i.test(String(virtualTourUrl).trim())) {
            return res.status(400).json({ error: 'Virtual tour link must start with http:// or https://' });
        }
        const nPrice = optNumber(price), nBeds = optNumber(beds), nBaths = optNumber(baths);
        if (nPrice === undefined || nPrice < 0) return res.status(400).json({ error: 'A valid price is required' });
        if (nBeds === undefined || nBaths === undefined) return res.status(400).json({ error: 'Beds and baths are required' });

        const property = await prisma.property.create({
            data: {
                address: address.trim(), city: city.trim(), state: state.trim(), zip: zip.trim(),
                price:         nPrice,
                beds:          nBeds,
                baths:         nBaths,
                sqft:          sqft          ? parseInt(sqft)          : null,
                yearBuilt:     yearBuilt     ? parseInt(yearBuilt)     : null,
                parkingSpaces: parkingSpaces ? parseInt(parkingSpaces) : null,
                hoaFee:        hoaFee        ? parseFloat(hoaFee)      : null,
                description,
                status:        PROP_STATUSES.includes(status) ? status : 'ACTIVE',
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
            where: { id: String(req.params.id), orgId: req.user.orgId },
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
        for (const f of ['virtualTourUrl', 'featuredImage']) {
            if (data[f] && !/^https?:\/\//i.test(String(data[f]).trim())) {
                return res.status(400).json({ error: `${f} must start with http:// or https://` });
            }
        }
        if (data.status !== undefined && !PROP_STATUSES.includes(data.status)) {
            return res.status(400).json({ error: 'Invalid status' });
        }
        for (const f of ['price', 'beds', 'baths']) {
            if (data[f] === undefined) continue;
            const n = optNumber(data[f]);
            if (n === undefined || n < 0) return res.status(400).json({ error: `Invalid ${f}` });
            data[f] = n;
        }
        for (const f of ['sqft', 'yearBuilt', 'parkingSpaces', 'hoaFee']) {
            if (data[f] === undefined) continue;
            const n = optNumber(data[f]);
            data[f] = n === undefined ? null : (f === 'hoaFee' ? n : Math.round(n));
        }
        for (const f of ['listingDate', 'expirationDate']) {
            if (data[f] === undefined) continue;
            data[f] = optDate(data[f]) ?? null;
        }
        if (data.featured !== undefined) data.featured = data.featured === true || data.featured === 'true';

        const updated = await prisma.property.update({ where: { id: String(req.params.id) }, data });
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
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!existing) return res.status(404).json({ error: 'Property not found' });

        const canDelete = existing.agentId === req.user.userId ||
            ['FIRMADMIN', 'SUPERADMIN', 'MANAGER'].includes(req.user.role);
        if (!canDelete) return res.status(403).json({ error: 'Forbidden' });

        await prisma.property.update({
            where: { id: String(req.params.id) },
            data:  { status: 'WITHDRAWN' },
        });
        res.json({ message: 'Property withdrawn' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to delete property' });
    }
});

export default router;
