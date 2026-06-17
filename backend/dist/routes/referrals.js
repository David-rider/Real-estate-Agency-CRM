"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const router = express_1.default.Router();
// Get all referrals for an org
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const referrals = await server_1.prisma.referral.findMany({
            where: { orgId },
            include: { referrer: true, referee: true }
        });
        res.json(referrals);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new referral
router.post('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const referrerId = req.user?.userId;
        const { refereeId, status } = req.body;
        const referral = await server_1.prisma.referral.create({
            data: { referrerId, refereeId, status: status || 'PENDING', orgId }
        });
        res.status(201).json(referral);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
