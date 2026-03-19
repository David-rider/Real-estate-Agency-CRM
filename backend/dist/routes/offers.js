"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/offers
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.userId;
        if (!orgId || !userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const offers = await prisma.offer.findMany({
            where: { orgId, agentId: userId },
            include: { property: true, client: true }
        });
        res.json(offers);
    }
    catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});
// POST /api/offers
router.post('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const agentId = req.user?.userId;
        if (!orgId || !agentId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { amount, propertyId, clientId } = req.body;
        const newOffer = await prisma.offer.create({
            data: {
                amount: parseFloat(amount),
                propertyId,
                clientId,
                agentId,
                orgId,
                status: 'PENDING'
            }
        });
        res.status(201).json(newOffer);
    }
    catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
});
exports.default = router;
