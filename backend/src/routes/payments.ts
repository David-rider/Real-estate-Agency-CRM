import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';
import { authenticateToken, AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();

const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

const PLAN_PRICES: Record<string, string | undefined> = {
    PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    ELITE_MONTHLY: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    ELITE_ANNUAL: process.env.STRIPE_PRICE_ELITE_ANNUAL,
};

// Subscription is ORG-LEVEL: purchasing upgrades the whole organization.
// User.tier mirrors the org subscription so JWT-based requireTier keeps working.
const TIER_TO_ORG_SUB: Record<string, 'BASIC' | 'PRO' | 'ENTERPRISE'> = {
    CORE: 'BASIC',
    PRO: 'PRO',
    ELITE: 'ENTERPRISE',
};

// Applies a tier change to the purchaser's entire organization
async function applyOrgTier(orgId: string, tier: 'CORE' | 'PRO' | 'ELITE') {
    await prisma.$transaction([
        prisma.organization.update({
            where: { id: orgId },
            data:  { subscription: TIER_TO_ORG_SUB[tier] },
        }),
        prisma.user.updateMany({
            where: { orgId },
            data:  { tier },
        }),
    ]);
}

// POST /api/payments/checkout — create Stripe Checkout Session
router.post('/checkout', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        // Billing is org-wide — only org admins may purchase
        if (!['SUPERADMIN', 'FIRMADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Only your Firm Admin can manage the subscription. Please contact them to upgrade.' });
        }

        if (!stripe) return res.status(503).json({ error: 'Payment service not configured. Set STRIPE_SECRET_KEY.' });

        const { planId } = req.body;
        const priceId = PLAN_PRICES[planId];
        if (!priceId) return res.status(400).json({ error: 'Invalid plan ID' });

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
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Checkout failed. Please try again or contact support.' });
    }
});

// POST /api/payments/webhook — Stripe webhook handler
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
    if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });

    const sig = req.headers['stripe-signature'] as string;
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    // SECURITY: in production a webhook secret is mandatory — an unverified payload
    // would let anyone forge a checkout.session.completed and upgrade themselves free.
    if (!webhookSecret && process.env.NODE_ENV === 'production') {
        console.error('STRIPE_WEBHOOK_SECRET is not set — rejecting webhook in production');
        return res.status(503).json({ error: 'Webhook signature verification not configured' });
    }

    let event: { type: string; data: { object: any } };
    try {
        if (webhookSecret) {
            event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
        } else {
            // Development only — unsigned payload accepted for local testing
            event = JSON.parse(req.body.toString());
        }
    } catch (err: any) {
        console.error('Webhook signature error:', err.message);
        return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const userId = session.metadata?.userId || session.client_reference_id;
        const planId = session.metadata?.planId || '';
        const targetTier = planId.toUpperCase().includes('ELITE') ? 'ELITE' : 'PRO';

        if (userId) {
            const purchaser = await prisma.user.findUnique({ where: { id: userId } });
            if (purchaser) {
                await applyOrgTier(purchaser.orgId, targetTier as 'PRO' | 'ELITE');
                console.log(`Org ${purchaser.orgId} upgraded to ${targetTier} (purchased by ${userId})`);
            }
        }
    }

    // Subscription cancelled or lapsed — downgrade the user back to CORE
    if (event.type === 'customer.subscription.deleted') {
        const subscription = event.data.object;
        try {
            const customer = await stripe.customers.retrieve(subscription.customer as string);
            const customerEmail = (customer as any)?.email;
            if (customerEmail) {
                const user = await prisma.user.findUnique({ where: { email: customerEmail } });
                if (user) {
                    await applyOrgTier(user.orgId, 'CORE');
                    console.log(`Org ${user.orgId} downgraded to CORE (subscription cancelled)`);
                }
            }
        } catch (err) {
            console.error('Failed to process subscription cancellation:', err);
        }
    }

    res.json({ received: true });
});

// GET /api/payments/portal — Stripe Customer Portal
router.get('/portal', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        // Find or create Stripe customer
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        const customers = await stripe.customers.list({ email: user.email, limit: 1 });
        const customer = customers.data[0] || await stripe.customers.create({ email: user.email, name: user.name });

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: customer.id,
            return_url: `${appUrl}/settings`,
        });

        res.json({ url: portalSession.url });
    } catch (error: any) {
        console.error('Portal error:', error);
        res.status(500).json({ error: 'Failed to open the billing portal. Please try again.' });
    }
});

export default router;
