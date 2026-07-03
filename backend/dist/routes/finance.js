"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// GET /api/finance/metrics
// Gets the high-level YTD metrics and firm leaderboard for the current user
router.get('/metrics', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.orgId;
        if (!userId || !orgId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // 1. Calculate YTD Gross Written and Net Payout for the current user
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(currentYear, 0, 1);
        const userCommissions = await server_1.prisma.commission.findMany({
            where: {
                agentId: userId,
                orgId: orgId,
                status: 'PAID', // Only count paid commissions
                paidAt: {
                    gte: startOfYear
                }
            }
        });
        const ytdGross = userCommissions.reduce((sum, comm) => sum + comm.grossAmount, 0);
        const ytdNet = userCommissions.reduce((sum, comm) => sum + comm.netPayout, 0);
        // 2. Fetch Firm Leaderboard (Mocking ranks based on DB gross amounts)
        // Group commissions by agentId
        const allCommissions = await server_1.prisma.commission.findMany({
            where: {
                orgId: orgId,
                status: 'PAID',
                paidAt: { gte: startOfYear }
            },
            include: { agent: true }
        });
        const agentTotals = {};
        allCommissions.forEach((comm) => {
            if (!agentTotals[comm.agentId]) {
                agentTotals[comm.agentId] = { name: comm.agent.name, gross: 0, userId: comm.agentId };
            }
            agentTotals[comm.agentId].gross += comm.grossAmount;
        });
        const leaderboard = Object.values(agentTotals)
            .sort((a, b) => b.gross - a.gross)
            .map((agent, index) => ({
            rank: index + 1,
            name: agent.name,
            gross: agent.gross,
            userId: agent.userId
        }));
        // Determine user's rank
        const userRankIndex = leaderboard.findIndex(l => l.userId === req.user?.userId);
        let topPercent = 'N/A';
        if (userRankIndex !== -1 && leaderboard.length > 0) {
            const percent = ((userRankIndex + 1) / leaderboard.length) * 100;
            topPercent = `Top ${Math.ceil(percent)}%`;
        }
        res.json({
            ytdGross,
            ytdNet,
            topPercent,
            leaderboard: leaderboard.slice(0, 5), // Top 5
            userRank: userRankIndex !== -1 ? leaderboard[userRankIndex] : null
        });
    }
    catch (error) {
        console.error('Error fetching finance metrics:', error);
        res.status(500).json({ error: 'Failed to fetch finance metrics' });
    }
});
// GET /api/finance/commissions
// Gets the paginated waterfall details for the current user
router.get('/commissions', (0, authMiddleware_1.requireTier)('PRO'), async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.orgId;
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;
        if (!userId || !orgId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const [commissions, total] = await Promise.all([
            server_1.prisma.commission.findMany({
                where: { agentId: userId, orgId: orgId },
                include: {
                    transaction: {
                        include: {
                            property: true
                        }
                    }
                },
                orderBy: { createdAt: 'desc' },
                skip,
                take: limit,
            }),
            server_1.prisma.commission.count({ where: { agentId: userId, orgId: orgId } })
        ]);
        res.json({
            data: commissions,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        });
    }
    catch (error) {
        console.error('Error fetching commissions:', error);
        res.status(500).json({ error: 'Failed to fetch commissions' });
    }
});
// POST /api/finance/commissions/:id/payout
// Agent submits a payout REQUEST — an org admin must approve it before it becomes PAID
router.post('/commissions/:id/payout', async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.orgId;
        const commId = String(req.params.id);
        if (!userId || !orgId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        const commission = await server_1.prisma.commission.findUnique({
            where: { id: commId }
        });
        if (!commission || commission.agentId !== userId || commission.orgId !== orgId) {
            return res.status(404).json({ error: 'Commission not found or unauthorized' });
        }
        if (commission.status === 'PAID') {
            return res.status(400).json({ error: 'Commission is already paid' });
        }
        if (commission.status === 'REQUESTED') {
            return res.status(400).json({ error: 'Payout already requested — awaiting admin approval' });
        }
        const updated = await server_1.prisma.commission.update({
            where: { id: commId },
            data: { status: 'REQUESTED' }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error requesting payout:', error);
        res.status(500).json({ error: 'Failed to request payout' });
    }
});
// GET /api/finance/payout-requests — pending approvals queue for admins
router.get('/payout-requests', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const requests = await server_1.prisma.commission.findMany({
            where: { orgId: req.user.orgId, status: 'REQUESTED' },
            include: {
                agent: { select: { id: true, name: true, email: true } },
                transaction: { include: { property: { select: { address: true } } } },
            },
            orderBy: { updatedAt: 'desc' },
        });
        res.json(requests);
    }
    catch (error) {
        console.error('Error fetching payout requests:', error);
        res.status(500).json({ error: 'Failed to fetch payout requests' });
    }
});
// POST /api/finance/commissions/:id/approve — admin approves a payout request → PAID
router.post('/commissions/:id/approve', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const commId = String(req.params.id);
        const commission = await server_1.prisma.commission.findFirst({
            where: { id: commId, orgId: req.user.orgId },
        });
        if (!commission)
            return res.status(404).json({ error: 'Commission not found' });
        if (commission.status !== 'REQUESTED') {
            return res.status(400).json({ error: `Cannot approve a commission in ${commission.status} status` });
        }
        const updated = await server_1.prisma.commission.update({
            where: { id: commId },
            data: { status: 'PAID', paidAt: new Date() },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error approving payout:', error);
        res.status(500).json({ error: 'Failed to approve payout' });
    }
});
// POST /api/finance/commissions/:id/reject — admin rejects a payout request → back to PENDING
router.post('/commissions/:id/reject', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const commId = String(req.params.id);
        const commission = await server_1.prisma.commission.findFirst({
            where: { id: commId, orgId: req.user.orgId },
        });
        if (!commission)
            return res.status(404).json({ error: 'Commission not found' });
        if (commission.status !== 'REQUESTED') {
            return res.status(400).json({ error: `Cannot reject a commission in ${commission.status} status` });
        }
        const updated = await server_1.prisma.commission.update({
            where: { id: commId },
            data: { status: 'PENDING' },
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Error rejecting payout:', error);
        res.status(500).json({ error: 'Failed to reject payout' });
    }
});
// GET /api/finance/projections
// Calculates estimated future revenue based on active listings and pending offers
router.get('/projections', (0, authMiddleware_1.requireTier)('ELITE'), async (req, res) => {
    try {
        const userId = req.user?.userId;
        const orgId = req.user?.orgId;
        if (!userId || !orgId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }
        // Fetch pending offers and active listings
        const [pendingOffers, activeListings] = await Promise.all([
            server_1.prisma.offer.findMany({
                where: {
                    agentId: userId,
                    orgId: orgId,
                    status: { in: ['PENDING', 'COUNTER'] }
                }
            }),
            server_1.prisma.property.findMany({
                where: {
                    agentId: userId,
                    orgId: orgId,
                    status: 'ACTIVE'
                }
            })
        ]);
        // Constants for estimation
        const AVG_COMMISSION_RATE = 0.025; // 2.5%
        const AGENT_NET_RATIO = 0.7; // 70% net payout after firm split
        const OFFER_CLOSE_PROBABILITY = 0.8;
        const LISTING_CLOSE_PROBABILITY = 0.4;
        const now = new Date();
        const projections = [];
        // Generate next 6 months
        for (let i = 0; i < 6; i++) {
            const date = new Date(now.getFullYear(), now.getMonth() + i, 1);
            const monthLabel = date.toLocaleString('default', { month: 'short' });
            let projectedAmount = 0;
            // Simple distribution:
            // Offers close in month 1-2
            if (i >= 1 && i <= 2) {
                const monthlyOfferPool = pendingOffers.length / 2;
                const totalOfferValue = pendingOffers.reduce((sum, o) => sum + o.amount, 0);
                projectedAmount += (totalOfferValue / 2) * AVG_COMMISSION_RATE * AGENT_NET_RATIO * OFFER_CLOSE_PROBABILITY;
            }
            // Listings close in month 3-6
            if (i >= 3 && i <= 5) {
                const totalListingValue = activeListings.reduce((sum, p) => sum + p.price, 0);
                projectedAmount += (totalListingValue / 3) * AVG_COMMISSION_RATE * AGENT_NET_RATIO * LISTING_CLOSE_PROBABILITY;
            }
            projections.push({
                month: monthLabel,
                amount: Math.round(projectedAmount),
            });
        }
        res.json(projections);
    }
    catch (error) {
        console.error('Error fetching projections:', error);
        res.status(500).json({ error: 'Failed to fetch projections' });
    }
});
exports.default = router;
