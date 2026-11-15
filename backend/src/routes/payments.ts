import { appUrl as getAppUrl } from '../lib/appUrl';
import express from 'express';
import Stripe from 'stripe';
import { prisma } from '../server';
import { authenticateToken, AuthRequest, clearAccountCache } from '../middleware/authMiddleware';

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

type Tier = 'CORE' | 'PRO' | 'ELITE';

// The plan is read from the price Stripe is actually charging, never from text the browser sent
const PRICE_TIER: Record<string, Tier> = {};
for (const [plan, price] of Object.entries(PLAN_PRICES)) {
    if (price) PRICE_TIER[price] = plan.startsWith('ELITE') ? 'ELITE' : 'PRO';
}

// Subscription is ORG-LEVEL: purchasing upgrades the whole organization.
// User.tier mirrors the org subscription so requireTier keeps working.
const TIER_TO_ORG_SUB: Record<Tier, 'BASIC' | 'PRO' | 'ENTERPRISE'> = {
    CORE: 'BASIC',
    PRO: 'PRO',
    ELITE: 'ENTERPRISE',
};

const BILLING_ADMINS = ['SUPERADMIN', 'FIRMADMIN'];
const ADMIN_ONLY = 'Only your Firm Admin can manage the subscription. Please contact them to upgrade.';

// Applies a plan to the whole organization, together with the Stripe references that go with it
async function applyOrgTier(orgId: string, tier: Tier, billing: { stripeCustomerId?: string; stripeSubscriptionId?: string | null; subscriptionStatus?: string | null } = {}) {
    await prisma.$transaction([
        prisma.organization.update({
            where: { id: orgId },
            data:  { subscription: TIER_TO_ORG_SUB[tier], ...billing },
        }),
        prisma.user.updateMany({
            where: { orgId },
            data:  { tier },
        }),
    ]);
    clearAccountCache(); // the new plan applies on the next request, not 30 s later
}

const idOf = (v: unknown): string | null =>
    typeof v === 'string' ? v : (v && typeof (v as { id?: unknown }).id === 'string' ? (v as { id: string }).id : null);

// What plan a subscription pays for right now. null = leave the plan as it is.
function tierOfSubscription(sub: any): Tier | null {
    const status = String(sub?.status || '');
    // Ended, or Stripe gave up collecting: back to the free plan
    if (['canceled', 'unpaid', 'incomplete_expired', 'paused'].includes(status)) return 'CORE';
    // past_due: a charge failed and Stripe is still retrying — the plan stays until Stripe gives up
    if (!['active', 'trialing', 'past_due'].includes(status)) return null; // e.g. incomplete: first payment not made yet
    const priceId = idOf(sub?.items?.data?.[0]?.price);
    const tier = priceId ? PRICE_TIER[priceId] : undefined;
    if (!tier) {
        console.error(`Stripe subscription ${sub?.id} uses a price this server does not know (${priceId}); plan left unchanged`);
        return null;
    }
    return tier;
}

// Brings one organization in line with a Stripe subscription. Safe to run repeatedly.
// The organization is found by its stored Stripe customer, or by the orgId this server wrote into the metadata.
async function syncSubscription(sub: any, orgIdHint?: string | null): Promise<Tier | null> {
    const customerId = idOf(sub?.customer);
    const subId = idOf(sub);
    if (!customerId || !subId) return null;

    let org = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
    if (!org) {
        const orgId = orgIdHint || sub?.metadata?.orgId;
        if (typeof orgId === 'string' && orgId) {
            const candidate = await prisma.organization.findUnique({ where: { id: orgId } });
            // Never re-point a brokerage that already belongs to another Stripe customer
            if (candidate && !candidate.stripeCustomerId) org = candidate;
        }
    }
    if (!org) {
        console.error(`Stripe subscription ${subId}: no brokerage matches customer ${customerId}`);
        return null;
    }

    const tier = tierOfSubscription(sub);
    const isCurrent = !org.stripeSubscriptionId || org.stripeSubscriptionId === subId;
    // An older subscription ending must not take away the plan paid for by the current one
    if (!isCurrent && tier === 'CORE') return null;
    if (tier === null) {
        if (isCurrent) {
            await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId, subscriptionStatus: String(sub.status || '') || null } });
        }
        return null;
    }
    await applyOrgTier(org.id, tier, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: tier === 'CORE' ? null : subId,
        subscriptionStatus: String(sub.status || '') || null,
    });
    console.log(`Org ${org.id} plan is now ${tier} (Stripe subscription ${subId}, ${sub.status})`);
    return tier;
}

// A finished Checkout Session: apply the subscription it created to the brokerage that started it
async function applyCheckoutSession(session: any): Promise<Tier | null> {
    if (session?.mode && session.mode !== 'subscription') return null;
    if (session?.status && session.status !== 'complete') return null;
    let orgId: string | null = session?.metadata?.orgId || null;
    if (!orgId) {
        // Sessions created before orgId was recorded only carry the purchaser's user id
        const userId = session?.metadata?.userId || session?.client_reference_id;
        const purchaser = userId ? await prisma.user.findUnique({ where: { id: String(userId) }, select: { orgId: true } }) : null;
        orgId = purchaser?.orgId || null;
    }
    if (!session?.subscription) return null;
    const sub = typeof session.subscription === 'string'
        ? await stripe!.subscriptions.retrieve(session.subscription)
        : session.subscription;
    return syncSubscription(sub, orgId);
}

// POST /api/payments/checkout — create Stripe Checkout Session
router.post('/checkout', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        // Billing is org-wide — only org admins may purchase
        if (!BILLING_ADMINS.includes(req.user.role)) {
            return res.status(403).json({ error: ADMIN_ONLY });
        }

        if (!stripe) return res.status(503).json({ error: 'Payment service not configured. Set STRIPE_SECRET_KEY.' });

        const { planId } = req.body;
        const priceId = typeof planId === 'string' ? PLAN_PRICES[planId] : undefined;
        if (!priceId) return res.status(400).json({ error: 'Invalid plan ID' });

        const [org, user] = await Promise.all([
            prisma.organization.findUnique({ where: { id: req.user.orgId } }),
            prisma.user.findUnique({ where: { id: req.user.userId }, select: { email: true } }),
        ]);
        if (!org || !user) return res.status(404).json({ error: 'User not found' });

        // One subscription per brokerage: a second checkout would bill twice. Changes go through the billing page.
        if (org.stripeSubscriptionId && org.subscription !== 'BASIC') {
            return res.status(409).json({ error: 'Your brokerage already has a subscription. Use Manage billing to change or cancel it.' });
        }

        let customerId = org.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({ email: user.email, name: org.name, metadata: { orgId: org.id } });
            customerId = customer.id;
            await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
        }

        const appUrl = getAppUrl();

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/upgrade?canceled=true`,
            client_reference_id: org.id,
            metadata: { planId, orgId: org.id, userId: req.user.userId },
            subscription_data: { metadata: { orgId: org.id } },
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Checkout failed. Please try again or contact support.' });
    }
});

// POST /api/payments/confirm — called when the buyer returns from Stripe, so the plan is applied
// even if the webhook has not arrived yet. The session must belong to the caller's brokerage.
router.post('/confirm', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });
        const sessionId = req.body?.sessionId;
        if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) {
            return res.status(400).json({ error: 'Invalid checkout session' });
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
        if (session.metadata?.orgId !== req.user.orgId) return res.status(400).json({ error: 'Invalid checkout session' });
        const tier = await applyCheckoutSession(session);
        res.json({ applied: tier !== null, tier });
    } catch (error: any) {
        console.error('Stripe confirm error:', error?.message || error);
        res.status(400).json({ error: 'Invalid checkout session' });
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

    try {
        const obj = event.data.object;
        if (event.type === 'checkout.session.completed') {
            await applyCheckoutSession(obj);
        } else if (['customer.subscription.created', 'customer.subscription.updated', 'customer.subscription.deleted'].includes(event.type)) {
            // Events can arrive out of order, so act on the subscription as Stripe has it now.
            // (Unsigned development payloads are used as sent.)
            const sub = webhookSecret ? await stripe.subscriptions.retrieve(obj.id) : obj;
            await syncSubscription(sub);
        }
    } catch (err: any) {
        // A 500 makes Stripe deliver the event again later
        console.error(`Stripe webhook ${event.type} failed:`, err?.message || err);
        return res.status(500).json({ error: 'Webhook processing failed' });
    }

    res.json({ received: true });
});

// GET /api/payments/portal — Stripe Customer Portal for the brokerage's own subscription
router.get('/portal', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!BILLING_ADMINS.includes(req.user.role)) return res.status(403).json({ error: ADMIN_ONLY });
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });

        const org = await prisma.organization.findUnique({ where: { id: req.user.orgId }, select: { stripeCustomerId: true } });
        if (!org?.stripeCustomerId) return res.status(400).json({ error: 'There is no paid subscription to manage yet.' });

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: org.stripeCustomerId,
            return_url: `${getAppUrl()}/upgrade`,
        });

        res.json({ url: portalSession.url });
    } catch (error: any) {
        console.error('Portal error:', error);
        res.status(500).json({ error: 'Failed to open the billing portal. Please try again.' });
    }
});

export default router;
