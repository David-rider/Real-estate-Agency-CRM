import { appUrl as getAppUrl } from '../lib/appUrl';
import express from 'express';
import { prisma } from '../server';
import { authenticateToken, AuthRequest, invalidateAccount } from '../middleware/authMiddleware';
import { stripe, isBillableRole, billingStart, graceEndsAt, planRequired, mustPay, FREE_ROLES } from '../lib/billing';

const router = express.Router();

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

const NO_PLAN_NEEDED = 'Your role does not need a paid plan.';

// Billing is PER MEMBER (see lib/billing.ts): a subscription belongs to one user and sets that user's plan only.
async function applyUserTier(userId: string, tier: Tier, billing: { stripeCustomerId?: string; stripeSubscriptionId?: string | null; subscriptionStatus?: string | null } = {}) {
    await prisma.user.update({ where: { id: userId }, data: { tier, ...billing } });
    invalidateAccount(userId); // the new plan applies on the next request, not 30 s later
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

// Brings one member in line with a Stripe subscription. Safe to run repeatedly.
// The member is found by their stored Stripe customer, or by the userId this server wrote into the metadata.
async function syncSubscription(sub: any, userIdHint?: string | null): Promise<Tier | null> {
    const customerId = idOf(sub?.customer);
    const subId = idOf(sub);
    if (!customerId || !subId) return null;

    let user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (!user) {
        const userId = userIdHint || sub?.metadata?.userId;
        if (typeof userId === 'string' && userId) {
            const candidate = await prisma.user.findUnique({ where: { id: userId } });
            // Never re-point a member who already belongs to another Stripe customer
            if (candidate && !candidate.stripeCustomerId) user = candidate;
        }
    }
    if (!user) {
        console.error(`Stripe subscription ${subId}: no member matches customer ${customerId}`);
        return null;
    }

    const tier = tierOfSubscription(sub);
    const isCurrent = !user.stripeSubscriptionId || user.stripeSubscriptionId === subId;
    // An older subscription ending must not take away the plan paid for by the current one
    if (!isCurrent && tier === 'CORE') return null;
    if (tier === null) {
        if (isCurrent) {
            await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId, subscriptionStatus: String(sub.status || '') || null } });
        }
        return null;
    }
    await applyUserTier(user.id, tier, {
        stripeCustomerId: customerId,
        stripeSubscriptionId: tier === 'CORE' ? null : subId,
        subscriptionStatus: String(sub.status || '') || null,
    });
    console.log(`User ${user.id} plan is now ${tier} (Stripe subscription ${subId}, ${sub.status})`);
    return tier;
}

// A finished Checkout Session: apply the subscription it created to the member who started it
async function applyCheckoutSession(session: any): Promise<Tier | null> {
    if (session?.mode && session.mode !== 'subscription') return null;
    if (session?.status && session.status !== 'complete') return null;
    if (!session?.subscription) return null;
    const userId = session?.metadata?.userId || session?.client_reference_id || null;
    const sub = typeof session.subscription === 'string'
        ? await stripe!.subscriptions.retrieve(session.subscription)
        : session.subscription;
    return syncSubscription(sub, userId ? String(userId) : null);
}

// Once plans are required, a member still on the free plan must upgrade before adding team members
// (a team of two or more needs every internal member on a paid plan).
export const PAY_BEFORE_INVITING = 'Choose a paid plan for yourself before adding team members.';
export async function inviterMustPay(userId: string): Promise<boolean> {
    const start = billingStart();
    if (!start) return false;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, tier: true, createdAt: true } });
    return !!u && mustPay(u, start);
}

// A member who leaves the brokerage (deactivated) must stop being charged.
// Best effort: a Stripe failure is logged and never blocks the deactivation.
export async function cancelMemberSubscription(userId: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true, tier: true } });
        if (!user) return;
        if (stripe && user.stripeSubscriptionId) await stripe.subscriptions.cancel(user.stripeSubscriptionId);
        if (user.stripeSubscriptionId || user.tier !== 'CORE') {
            await applyUserTier(userId, 'CORE', { stripeSubscriptionId: null, subscriptionStatus: user.stripeSubscriptionId ? 'canceled' : null });
        }
    } catch (err: any) {
        console.error(`Could not cancel the subscription of user ${userId}:`, err?.message || err);
    }
}

// GET /api/payments/status — the caller's own plan, and whether (and from when) a paid plan is required
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { role: true, tier: true, createdAt: true, stripeSubscriptionId: true, subscriptionStatus: true } });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const start = billingStart();
        const internalMembers = await prisma.user.count({ where: { orgId: req.user.orgId, isActive: true, role: { notIn: FREE_ROLES as any } } });
        const inTeam = internalMembers > 1;
        const grace = graceEndsAt(user, start);
        res.json({
            tier: user.tier,
            billable: isBillableRole(user.role),
            hasSubscription: Boolean(user.stripeSubscriptionId),
            subscriptionStatus: user.subscriptionStatus,
            // A plan is needed now (blocked until one is chosen)
            planRequired: planRequired(user, internalMembers, start),
            // Still free for now, but a plan will be needed on this date
            graceEndsAt: start && inTeam && isBillableRole(user.role) && user.tier === 'CORE' && grace && grace.getTime() > Date.now() ? grace.toISOString() : null,
        });
    } catch (error) {
        console.error('Billing status error:', error);
        res.status(500).json({ error: 'Failed to load billing status' });
    }
});

// POST /api/payments/checkout — a member buys a plan for themselves
router.post('/checkout', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!isBillableRole(req.user.role)) return res.status(403).json({ error: NO_PLAN_NEEDED });

        if (!stripe) return res.status(503).json({ error: 'Payment service not configured. Set STRIPE_SECRET_KEY.' });

        const { planId } = req.body;
        const priceId = typeof planId === 'string' ? PLAN_PRICES[planId] : undefined;
        if (!priceId) return res.status(400).json({ error: 'Invalid plan ID' });

        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // One subscription per member: a second checkout would bill twice. Changes go through the billing page.
        if (user.stripeSubscriptionId && user.tier !== 'CORE') {
            return res.status(409).json({ error: 'You already have a subscription. Use Manage billing to change or cancel it.' });
        }

        let customerId = user.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({ email: user.email, name: user.name, metadata: { userId: user.id } });
            customerId = customer.id;
            await prisma.user.update({ where: { id: user.id }, data: { stripeCustomerId: customerId } });
        }

        const appUrl = getAppUrl();

        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items: [{ price: priceId, quantity: 1 }],
            success_url: `${appUrl}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/upgrade?canceled=true`,
            client_reference_id: user.id,
            metadata: { planId, userId: user.id },
            subscription_data: { metadata: { userId: user.id } },
        });

        res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe checkout error:', error);
        res.status(500).json({ error: 'Checkout failed. Please try again or contact support.' });
    }
});

// POST /api/payments/confirm — called when the buyer returns from Stripe, so the plan is applied
// even if the webhook has not arrived yet. The session must be the caller's own.
router.post('/confirm', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });
        const sessionId = req.body?.sessionId;
        if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) {
            return res.status(400).json({ error: 'Invalid checkout session' });
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
        if (session.metadata?.userId !== req.user.userId) return res.status(400).json({ error: 'Invalid checkout session' });
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

// GET /api/payments/portal — Stripe Customer Portal for the caller's own subscription
router.get('/portal', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });

        const user = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { stripeCustomerId: true } });
        if (!user?.stripeCustomerId) return res.status(400).json({ error: 'There is no paid subscription to manage yet.' });

        const portalSession = await stripe.billingPortal.sessions.create({
            customer: user.stripeCustomerId,
            return_url: `${getAppUrl()}/upgrade`,
        });

        res.json({ url: portalSession.url });
    } catch (error: any) {
        console.error('Portal error:', error);
        res.status(500).json({ error: 'Failed to open the billing portal. Please try again.' });
    }
});

export default router;
