"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const notifications_1 = require("./notifications");
const router = express_1.default.Router();
// GET /api/offers
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.userId;
        if (!orgId || !userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const offers = await server_1.prisma.offer.findMany({
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
        const newOffer = await server_1.prisma.offer.create({
            data: {
                amount: parseFloat(amount),
                propertyId,
                clientId,
                agentId,
                orgId,
                status: 'PENDING'
            }
        });
        // Notify the agent about the new offer
        const property = await server_1.prisma.property.findUnique({ where: { id: propertyId }, select: { address: true } });
        await (0, notifications_1.createNotification)(agentId, orgId, 'OFFER', 'New Offer Submitted', `A new offer of $${parseFloat(amount).toLocaleString()} has been submitted for ${property?.address || 'a property'}.`, '/transactions');
        res.status(201).json(newOffer);
    }
    catch (error) {
        console.error('Error creating offer:', error);
        res.status(500).json({ error: 'Failed to create offer' });
    }
});
exports.default = router;
