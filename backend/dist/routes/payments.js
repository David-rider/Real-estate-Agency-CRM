"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const authMiddleware_1 = require("../middleware/authMiddleware");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// POST /api/payments/checkout
// Simulate creating a payment intent and getting a client secret
router.post('/checkout', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { planId, paymentMethod } = req.body;
        if (!planId || !paymentMethod) {
            return res.status(400).json({ error: 'Plan ID and payment method are required' });
        }
        // Simulate network delay for third party API
        await new Promise(r => setTimeout(r, 1500));
        let amountForPlan = 0;
        switch (planId) {
            case 'PRO_MONTHLY':
                amountForPlan = 3900;
                break;
            case 'PRO_ANNUAL':
                amountForPlan = 39000;
                break;
            case 'ELITE_MONTHLY':
                amountForPlan = 7900;
                break;
            case 'ELITE_ANNUAL':
                amountForPlan = 79000;
                break;
            default:
                return res.status(400).json({ error: 'Invalid plan ID' });
        }
        // Simulate returning a payment intent or order ID
        const fakePaymentIntentId = `pi_${paymentMethod}_${Date.now()}_${Math.random().toString(36).substring(7)}`;
        res.json({
            clientSecret: `${fakePaymentIntentId}_secret`,
            paymentIntentId: fakePaymentIntentId,
            amount: amountForPlan,
            currency: 'usd'
        });
    }
    catch (error) {
        console.error('Checkout error:', error);
        res.status(500).json({ error: 'Internal server error processing checkout' });
    }
});
// POST /api/payments/confirm
// Simulate confirming payment success and upgrading the user's tier
router.post('/confirm', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        const { paymentIntentId, planId } = req.body;
        if (!paymentIntentId || !planId) {
            return res.status(400).json({ error: 'Payment Intent ID and plan ID are required' });
        }
        // Simulate processing delay
        await new Promise(r => setTimeout(r, 2000));
        // Determine target tier
        const targetTier = planId.toUpperCase().includes('ELITE') ? 'ELITE' : 'PRO';
        // Update the user's tier in the DB
        const updatedUser = await prisma.user.update({
            where: { id: req.user.userId },
            data: { tier: targetTier }
        });
        res.json({
            message: 'Payment confirmed successfully',
            status: 'succeeded',
            subscriptionDetails: {
                tier: updatedUser.tier,
                validUntil: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString()
            }
        });
    }
    catch (error) {
        console.error('Payment confirmation error:', error);
        res.status(500).json({ error: 'Internal server error confirming payment' });
    }
});
exports.default = router;
