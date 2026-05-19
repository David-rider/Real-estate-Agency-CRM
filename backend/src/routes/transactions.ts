import { Router } from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = Router();
router.use(authenticateToken);

// GET /api/transactions — paginated list with filters
router.get('/', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const page   = Math.max(1, parseInt(req.query.page  as string) || 1);
        const limit  = Math.min(100, parseInt(req.query.limit as string) || 20);
        const skip   = (page - 1) * limit;
        const status = req.query.status as string;

        const where: any = { orgId };
        if (status) where.status = status;

        // Agents only see own transactions unless manager+
        const isManager = ['FIRMADMIN','SUPERADMIN','MANAGER'].includes(req.user!.role);
        if (!isManager) where.agentId = req.user!.userId;

        const [transactions, total] = await Promise.all([
            prisma.transaction.findMany({
                where,
                skip,
                take: limit,
                include: {
                    client:   { select: { id: true, firstName: true, lastName: true, email: true } },
                    property: { select: { id: true, address: true, city: true, price: true, propertyType: true } },
                    agent:    { select: { id: true, name: true } },
                    commissions: { select: { id: true, status: true, netPayout: true } },
                },
                orderBy: { createdAt: 'desc' },
            }),
            prisma.transaction.count({ where }),
        ]);

        res.json({ data: transactions, total, page, limit, totalPages: Math.ceil(total / limit) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});

// GET /api/transactions/:id
router.get('/:id', async (req: AuthRequest, res) => {
    try {
        const orgId = req.user?.orgId;
        if (!orgId) return res.status(401).json({ error: 'Unauthorized' });

        const transaction = await prisma.transaction.findFirst({
            where: { id: req.params.id, orgId },
            include: {
                client:      true,
                property:    { include: { mediaAssets: { take: 1 } } },
                agent:       { select: { id: true, name: true, email: true, phone: true } },
                commissions: true,
                documents:   { orderBy: { createdAt: 'desc' } },
                transactionNotes: {
                    include: { author: { select: { name: true, avatarUrl: true } } },
                    orderBy: { createdAt: 'desc' },
                },
            },
        });

        if (!transaction) return res.status(404).json({ error: 'Transaction not found' });
        res.json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch transaction' });
    }
});

// POST /api/transactions
router.post('/', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { propertyId, clientId, price, status, contractDate, closingDate, contingencies, notes } = req.body;

        const transaction = await prisma.transaction.create({
            data: {
                propertyId,
                clientId,
                price:        parseFloat(price),
                status:       status || 'OFFER_REVIEW',
                contractDate: contractDate ? new Date(contractDate) : null,
                closingDate:  closingDate  ? new Date(closingDate)  : null,
                contingencies,
                notes,
                agentId:      req.user.userId,
                orgId:        req.user.orgId,
            },
            include: {
                client:   { select: { firstName: true, lastName: true } },
                property: { select: { address: true, city: true } },
            },
        });

        res.status(201).json(transaction);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to create transaction' });
    }
});

// PATCH /api/transactions/:id — update status and timeline fields
router.patch('/:id', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const existing = await prisma.transaction.findFirst({
            where: { id: req.params.id, orgId: req.user.orgId },
        });
        if (!existing) return res.status(404).json({ error: 'Transaction not found' });

        const canEdit = existing.agentId === req.user.userId ||
            ['FIRMADMIN','SUPERADMIN','MANAGER'].includes(req.user.role);
        if (!canEdit) return res.status(403).json({ error: 'Forbidden' });

        const allowed = ['status','price','acceptedPrice','contractDate','inspectionDate',
                         'boardPackageDate','clearToCloseDate','closingDate','contingencies','notes'];
        const data: any = {};
        for (const key of allowed) {
            if (req.body[key] !== undefined) data[key] = req.body[key];
        }
        // Parse dates
        const dateFields = ['contractDate','inspectionDate','boardPackageDate','clearToCloseDate','closingDate'];
        for (const f of dateFields) {
            if (data[f]) data[f] = new Date(data[f]);
        }
        if (data.price)         data.price         = parseFloat(data.price);
        if (data.acceptedPrice) data.acceptedPrice = parseFloat(data.acceptedPrice);

        const updated = await prisma.transaction.update({
            where: { id: req.params.id },
            data,
            include: {
                client:   { select: { firstName: true, lastName: true } },
                property: { select: { address: true, city: true } },
            },
        });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update transaction' });
    }
});

export default router;
