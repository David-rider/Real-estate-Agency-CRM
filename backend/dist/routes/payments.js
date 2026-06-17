"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const stripe_1 = __importDefault(require("stripe"));
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
const stripe = process.env.STRIPE_SECRET_KEY
    ? new stripe_1.default(process.env.STRIPE_SECRET_KEY)
    : null;
const PLAN_PRICES = {
    PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    ELITE_MONTHLY: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    ELITE_ANNUAL: process.env.STRIPE_PRICE_ELITE_ANNUAL,
};
// POST /api/payments/checkout — create Stripe Checkout Session
router.post('/checkout', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!stripe)
            return res.status(503).json({ error: 'Payment service not configured. Set STRIPE_SECRET_KEY.' });
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { planId } = req.body;
        const priceId = PLAN_PRICES[planId];
        if (!priceId)
            return res.status(400).json({ error: 'Invalid plan ID' });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            payment_method_types: ['card'],
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/upgrade?canceled=true`,
            client_reference_id: req.user.userId,
            metadata: { planId, userId: req.user.userId },
        });
        res.json({ sessionId: session.id, url: session.url });
    }
    catch (error) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: error.message || 'Checkout failed' });
    }
});
// POST /api/payments/webhook — Stripe webhook handler
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe)
        return res.status(503).json({ error: 'Payment service not configured' });
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        }
        else {
            event = JSON.parse(req.body.toString());
        }
    }
    catch (err) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).json({ error: `Webhook Error: ${err.message}` });
    }
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        const planId = session.metadata?.planId || '';
        const targetTier = planId.toUpperCase().includes('ELITE') ? 'ELITE' : 'PRO';
        if (userId) {
            await server_1.prisma.user.update({ where: { id: userId }, data: { tier: targetTier } });
            console.log(`User ${userId} upgraded to ${targetTier}`);
        }
    }
    res.json({ received: true });
});
// GET /api/payments/portal — Stripe Customer Portal
router.get('/portal', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!stripe)
            return res.status(503).json({ error: 'Payment service not configured' });
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        // Find or create Stripe customer
        const user = await server_1.prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        const customer = customers.data[0] || await stripe.customers.create({ email: user.email, name: user.name });
        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${appUrl}/settings`,
        });
        res.json({ url: portalSession.url });
    }
    catch (error) {
        console.error('Portal error:', error);
        res.status(500).json({ error: error.message || 'Failed to create portal session' });
    }
});
exports.default = router;
