"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all gift orders for an org
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const gifts = await prisma.giftOrder.findMany({
            where: { orgId },
            include: { client: true, agent: true }
        });
        res.json(gifts);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new gift order
router.post('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const agentId = req.user?.id;
        const { item, clientId, status } = req.body;
        const gift = await prisma.giftOrder.create({
            data: { item, clientId, agentId, status: status || 'ORDERED', orgId }
        });
        res.status(201).json(gift);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
