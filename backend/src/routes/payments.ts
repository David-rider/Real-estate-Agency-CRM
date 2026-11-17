import { appUrl as getAppUrl } from '../lib/appUrl';
import express from 'express';
import { prisma } from '../server';
import { authenticateToken, authorizeRole, AuthRequest, invalidateAccount, clearAccountCache } from '../middleware/authMiddleware';
import { stripe, isBillableRole, billingStart, graceEndsAt, planRequired, mustPay, seatChanges, onTrial, FREE_ROLES } from '../lib/billing';

const router = express.Router();

const PLAN_PRICES: Record<string, string | undefined> = {
    PRO_MONTHLY: process.env.STRIPE_PRICE_PRO_MONTHLY,
    PRO_ANNUAL: process.env.STRIPE_PRICE_PRO_ANNUAL,
    ELITE_MONTHLY: process.env.STRIPE_PRICE_ELITE_MONTHLY,
    ELITE_ANNUAL: process.env.STRIPE_PRICE_ELITE_ANNUAL,
};

type Tier = 'CORE' | 'PRO' | 'ELITE';
type PaidTier = 'PRO' | 'ELITE';
type Cycle = 'MONTHLY' | 'ANNUAL';

// The plan is read from the price Stripe is actually charging, never from text the browser sent
const PRICE_TIER: Record<string, Tier> = {};
for (const [plan, price] of Object.entries(PLAN_PRICES)) {
    if (price) PRICE_TIER[price] = plan.startsWith('ELITE') ? 'ELITE' : 'PRO';
}

const NO_PLAN_NEEDED = 'Your role does not need a paid plan.';
const COMPANY_ADMINS = ['SUPERADMIN', 'FIRMADMIN'];

// ── Who pays ──────────────────────────────────────────────────────────────────
// Billing is PER MEMBER (see lib/billing.ts). A member's plan can be paid in two ways:
//   1. by the member:    User.stripeSubscriptionId        → User.selfTier
//   2. by the brokerage: Organization.stripeSubscriptionId → one seat per internal member, at the level the
//                        admin chose for that member (User.companyTier, else Organization.companyPlan)
// User.tier is the plan the member actually has: the higher of the two, or Elite during the brokerage's free trial.
const RANK: Record<string, number> = { CORE: 0, PRO: 1, ELITE: 2 };
const higher = (a: Tier, b: Tier): Tier => (RANK[a] >= RANK[b] ? a : b);
const LIVE = ['active', 'trialing', 'past_due']; // past_due: a charge failed and Stripe is still retrying
const ENDED = ['canceled', 'unpaid', 'incomplete_expired', 'paused'];

type OrgBilling = { companyPlan: string | null; stripeSubscriptionId: string | null; subscriptionStatus: string | null };
const companyPays = (org: OrgBilling) => Boolean(org.companyPlan && org.stripeSubscriptionId && LIVE.includes(org.subscriptionStatus || ''));

// The level the brokerage pays for this member; null when the brokerage does not pay for them
function companyLevel(u: { role: string; isActive: boolean; companyTier: string | null }, org: OrgBilling): PaidTier | null {
    if (!companyPays(org) || !u.isActive || !isBillableRole(u.role)) return null;
    return (u.companyTier || org.companyPlan) === 'ELITE' ? 'ELITE' : 'PRO';
}

const idOf = (v: unknown): string | null =>
    typeof v === 'string' ? v : (v && typeof (v as { id?: unknown }).id === 'string' ? (v as { id: string }).id : null);

// Ends a member's own subscription. Returns false when Stripe could not be reached (nothing is changed then).
async function endOwnSubscription(userId: string, subscriptionId: string): Promise<boolean> {
    try {
        if (stripe) await stripe.subscriptions.cancel(subscriptionId);
        await prisma.user.update({ where: { id: userId }, data: { selfTier: 'CORE', stripeSubscriptionId: null, subscriptionStatus: 'canceled' } });
        return true;
    } catch (err: any) {
        console.error(`Could not cancel the subscription of user ${userId}:`, err?.message || err);
        return false;
    }
}

// Recomputes every member's plan in one brokerage from who pays for what. Safe to run repeatedly.
// A member the brokerage now pays for has their own subscription cancelled, so nobody is charged twice.
export async function refreshOrgTiers(orgId: string): Promise<void> {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { companyPlan: true, stripeSubscriptionId: true, subscriptionStatus: true, trialEndsAt: true } });
    if (!org) return;
    const members = await prisma.user.findMany({
        where: { orgId },
        select: { id: true, role: true, isActive: true, tier: true, selfTier: true, companyTier: true, stripeSubscriptionId: true },
    });
    for (const m of members) {
        const paidByCompany = companyLevel(m, org);
        let own = m.selfTier as Tier;
        if (paidByCompany && m.stripeSubscriptionId && await endOwnSubscription(m.id, m.stripeSubscriptionId)) own = 'CORE';
        const tier = onTrial(m, org) ? 'ELITE' : higher(own, paidByCompany || 'CORE');
        if (tier !== m.tier) await prisma.user.update({ where: { id: m.id }, data: { tier } });
    }
    clearAccountCache(); // new plans apply on the next request, not 30 s later
}

// Seats the brokerage pays for, by level
async function companySeats(orgId: string, org: OrgBilling & { companyPlan: string | null }): Promise<Record<PaidTier, number>> {
    const members = await prisma.user.findMany({ where: { orgId, isActive: true, role: { notIn: FREE_ROLES as any } }, select: { companyTier: true } });
    const seats: Record<PaidTier, number> = { PRO: 0, ELITE: 0 };
    for (const m of members) seats[(m.companyTier || org.companyPlan) === 'ELITE' ? 'ELITE' : 'PRO']++;
    return seats;
}

// The two Stripe calls seat billing needs (so the daily reconciliation can be exercised without Stripe)
export type SubscriptionsClient = { subscriptions: { retrieve(id: string): Promise<any>; update(id: string, params: any): Promise<any> } };

// Makes the brokerage's Stripe subscription charge for the seats it has now (one line per level, prorated by Stripe).
// Returns true when Stripe had to be corrected. `sub` may be passed when the caller has just fetched it.
async function syncCompanySeats(orgId: string, client: SubscriptionsClient | null = stripe, sub?: any): Promise<boolean> {
    const org = await prisma.organization.findUnique({ where: { id: orgId }, select: { companyPlan: true, companyCycle: true, stripeSubscriptionId: true, subscriptionStatus: true } });
    if (!client || !org || !companyPays(org)) return false;
    const cycle: Cycle = org.companyCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY';
    const seats = await companySeats(orgId, org);
    if (!sub) sub = await client.subscriptions.retrieve(org.stripeSubscriptionId!);
    const lines = (sub.items?.data || []).map((i: any) => ({ id: String(i.id), price: idOf(i.price) || '', quantity: Number(i.quantity ?? 0) }));
    const items = seatChanges(lines, seats, { PRO: PLAN_PRICES[`PRO_${cycle}`], ELITE: PLAN_PRICES[`ELITE_${cycle}`] });
    if (!items.length) return false;
    await client.subscriptions.update(org.stripeSubscriptionId!, { items, proration_behavior: 'create_prorations' });
    return true;
}

// Call whenever a brokerage's members or their levels change (joined, deactivated, reactivated, role or level changed).
// Never throws: a Stripe failure is logged and corrected by the daily reconciliation (reconcileCompanyBilling).
export async function companyChanged(orgId: string): Promise<void> {
    try { await syncCompanySeats(orgId); } catch (err: any) { console.error(`Could not update the seats billed to org ${orgId}:`, err?.message || err); }
    try { await refreshOrgTiers(orgId); } catch (err: any) { console.error(`Could not refresh plans of org ${orgId}:`, err?.message || err); }
}

// Returns members of brokerages whose free trial has ended to the plan they pay for. Runs with the reminder loop;
// looking back a week means a server that was down for a while still catches up. Returns how many brokerages were checked.
export async function endExpiredTrials(now = new Date()): Promise<number> {
    const orgs = await prisma.organization.findMany({
        where: { trialEndsAt: { lte: now, gt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
        select: { id: true },
    });
    for (const o of orgs) {
        try { await refreshOrgTiers(o.id); } catch (err: any) { console.error(`Could not end the trial of org ${o.id}:`, err?.message || err); }
    }
    return orgs.length;
}

// ── A member's own subscription ──────────────────────────────────────────────
async function applyUserTier(userId: string, selfTier: Tier, billing: { stripeCustomerId?: string; stripeSubscriptionId?: string | null; subscriptionStatus?: string | null } = {}) {
    const user = await prisma.user.update({
        where: { id: userId }, data: { selfTier, ...billing },
        select: { role: true, isActive: true, companyTier: true, organization: { select: { companyPlan: true, stripeSubscriptionId: true, subscriptionStatus: true, trialEndsAt: true } } },
    });
    const tier = onTrial(user, user.organization) ? 'ELITE' : higher(selfTier, companyLevel(user, user.organization) || 'CORE');
    await prisma.user.update({ where: { id: userId }, data: { tier } });
    invalidateAccount(userId); // the new plan applies on the next request, not 30 s later
}

// What plan a member's own subscription pays for right now. null = leave the plan as it is.
function tierOfSubscription(sub: any): Tier | null {
    const status = String(sub?.status || '');
    if (ENDED.includes(status)) return 'CORE'; // ended, or Stripe gave up collecting
    if (!LIVE.includes(status)) return null;    // e.g. incomplete: first payment not made yet
    const priceId = idOf(sub?.items?.data?.[0]?.price);
    const tier = priceId ? PRICE_TIER[priceId] : undefined;
    if (!tier) {
        console.error(`Stripe subscription ${sub?.id} uses a price this server does not know (${priceId}); plan left unchanged`);
        return null;
    }
    return tier;
}

type Hints = { userId?: string | null; orgId?: string | null; companyPlan?: string | null; companyCycle?: string | null };

type OrgSubscription = { id: string; stripeSubscriptionId: string | null; companyPlan: string | null; companyCycle: string | null };

// A brokerage's subscription changed: record it and recompute its members' plans
async function syncCompanySubscription(org: OrgSubscription, sub: any, hints: Hints): Promise<void> {
    if (await recordCompanySubscription(org, sub, hints)) await companyChanged(org.id);
}

// Stores what Stripe says about a brokerage's subscription. Returns false for an older subscription (nothing stored).
async function recordCompanySubscription(org: OrgSubscription, sub: any, hints: Hints): Promise<boolean> {
    const customerId = idOf(sub.customer)!;
    const subId = idOf(sub)!;
    const status = String(sub.status || '');
    const isCurrent = !org.stripeSubscriptionId || org.stripeSubscriptionId === subId;
    if (LIVE.includes(status)) {
        const plan = org.companyPlan || hints.companyPlan || sub.metadata?.companyPlan;
        const cycle = org.companyCycle || hints.companyCycle || sub.metadata?.companyCycle;
        await prisma.organization.update({
            where: { id: org.id },
            data: {
                stripeCustomerId: customerId, stripeSubscriptionId: subId, subscriptionStatus: status,
                companyPlan: plan === 'ELITE' ? 'ELITE' : 'PRO', companyCycle: cycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY',
            },
        });
    } else if (ENDED.includes(status) && isCurrent) {
        // The brokerage stopped paying: members fall back to whatever they pay for themselves
        await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId, stripeSubscriptionId: null, subscriptionStatus: status, companyPlan: null } });
    } else if (isCurrent) {
        await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId, subscriptionStatus: status || null } });
    } else {
        return false; // an older subscription: nothing to do
    }
    console.log(`Org ${org.id} company billing: subscription ${subId} is ${status}`);
    return true;
}

// Daily reconciliation of brokerage-paid plans. Seat counts are pushed to Stripe whenever a team changes, but that
// call can fail (Stripe unreachable) and a webhook can be missed. For every brokerage with a subscription this
// re-reads it from Stripe, stores its real status, makes Stripe charge for the seats the team has today and
// recomputes the members' plans. Safe to run at any time; one brokerage failing never stops the others.
export async function reconcileCompanyBilling(client: SubscriptionsClient | null = stripe): Promise<{ checked: number; corrected: number; failed: number }> {
    const result = { checked: 0, corrected: 0, failed: 0 };
    if (!client) return result;
    const orgs = await prisma.organization.findMany({
        where: { stripeSubscriptionId: { not: null } },
        select: { id: true, stripeSubscriptionId: true, subscriptionStatus: true, companyPlan: true, companyCycle: true },
    });
    for (const org of orgs) {
        result.checked++;
        try {
            const sub = await client.subscriptions.retrieve(org.stripeSubscriptionId!);
            const status = String(sub?.status || '');
            let corrected = false;
            if (status !== (org.subscriptionStatus || '')) {
                corrected = await recordCompanySubscription(org, sub, {}); // a missed webhook: e.g. cancelled or past due
            }
            if (await syncCompanySeats(org.id, client, sub)) corrected = true;
            await refreshOrgTiers(org.id);
            if (corrected) {
                result.corrected++;
                console.log(`[billing-reconcile] org ${org.id}: brought in line with Stripe (subscription ${org.stripeSubscriptionId}, ${status})`);
            }
        } catch (err: any) {
            result.failed++;
            console.error(`[billing-reconcile] org ${org.id} FAILED, will retry:`, err?.message || err);
        }
    }
    if (result.checked) console.log(`[billing-reconcile] ${result.checked} checked, ${result.corrected} corrected, ${result.failed} failed`);
    return result;
}

// Brings one member, or one brokerage, in line with a Stripe subscription. Safe to run repeatedly.
// The owner is found by the stored Stripe customer, or by the id this server wrote into the metadata.
async function syncSubscription(sub: any, hints: Hints = {}): Promise<Tier | null> {
    const customerId = idOf(sub?.customer);
    const subId = idOf(sub);
    if (!customerId || !subId) return null;

    let user = await prisma.user.findUnique({ where: { stripeCustomerId: customerId } });
    if (!user) {
        let org = await prisma.organization.findUnique({ where: { stripeCustomerId: customerId } });
        const orgId = hints.orgId || sub?.metadata?.orgId;
        if (!org && typeof orgId === 'string' && orgId) {
            const candidate = await prisma.organization.findUnique({ where: { id: orgId } });
            // Never re-point a brokerage that already belongs to another Stripe customer
            if (candidate && !candidate.stripeCustomerId) org = candidate;
        }
        if (org) { await syncCompanySubscription(org, sub, hints); return null; }

        const userId = hints.userId || sub?.metadata?.userId;
        if (typeof userId === 'string' && userId) {
            const candidate = await prisma.user.findUnique({ where: { id: userId } });
            // Never re-point a member who already belongs to another Stripe customer
            if (candidate && !candidate.stripeCustomerId) user = candidate;
        }
    }
    if (!user) {
        console.error(`Stripe subscription ${subId}: nobody matches customer ${customerId}`);
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
    console.log(`User ${user.id} pays for ${tier} (Stripe subscription ${subId}, ${sub.status})`);
    return tier;
}

// A finished Checkout Session: apply the subscription it created to the member or brokerage that started it
async function applyCheckoutSession(session: any): Promise<Tier | null> {
    if (session?.mode && session.mode !== 'subscription') return null;
    if (session?.status && session.status !== 'complete') return null;
    if (!session?.subscription) return null;
    const md = session.metadata || {};
    const sub = typeof session.subscription === 'string'
        ? await stripe!.subscriptions.retrieve(session.subscription)
        : session.subscription;
    if (md.orgId) return syncSubscription(sub, { orgId: String(md.orgId), companyPlan: md.companyPlan, companyCycle: md.companyCycle });
    const userId = md.userId || session.client_reference_id || null;
    return syncSubscription(sub, { userId: userId ? String(userId) : null });
}

// Once plans are required, a member still on the free plan must upgrade before adding team members
// (a team of two or more needs every internal member on a paid plan). A brokerage that pays for its
// members can always add more: the new member gets a seat.
export const PAY_BEFORE_INVITING = 'Choose a paid plan for yourself before adding team members.';
export async function inviterMustPay(userId: string): Promise<boolean> {
    const start = billingStart();
    if (!start) return false;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, tier: true, createdAt: true, organization: { select: { companyPlan: true, stripeSubscriptionId: true, subscriptionStatus: true } } } });
    if (!u || companyPays(u.organization)) return false;
    return mustPay(u, start);
}

// A member who leaves the brokerage (deactivated) must stop being charged, and frees the seat the brokerage paid for.
// Best effort: a Stripe failure is logged and never blocks the deactivation.
export async function cancelMemberSubscription(userId: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({ where: { id: userId }, select: { stripeSubscriptionId: true, orgId: true } });
        if (!user) return;
        if (user.stripeSubscriptionId) await endOwnSubscription(userId, user.stripeSubscriptionId);
        await companyChanged(user.orgId);
    } catch (err: any) {
        console.error(`Could not end the billing of user ${userId}:`, err?.message || err);
    }
}

// GET /api/payments/status — the caller's own plan, who pays for it, and whether (and from when) a paid plan is required
router.get('/status', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma.user.findUnique({
            where: { id: req.user.userId },
            select: { role: true, tier: true, selfTier: true, isActive: true, companyTier: true, createdAt: true, stripeSubscriptionId: true, subscriptionStatus: true, organization: { select: { companyPlan: true, stripeSubscriptionId: true, subscriptionStatus: true, trialEndsAt: true } } },
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        const start = billingStart();
        const internalMembers = await prisma.user.count({ where: { orgId: req.user.orgId, isActive: true, role: { notIn: FREE_ROLES as any } } });
        const inTeam = internalMembers > 1;
        const grace = graceEndsAt(user, start);
        const trial = onTrial(user, user.organization);
        res.json({
            tier: user.tier,
            // The plan the member (or the brokerage) actually pays for, without the free trial
            paidTier: higher(user.selfTier as Tier, companyLevel(user, user.organization) || 'CORE'),
            // The brokerage's free Elite trial is running until this moment
            trialEndsAt: trial ? user.organization.trialEndsAt!.toISOString() : null,
            billable: isBillableRole(user.role),
            hasSubscription: Boolean(user.stripeSubscriptionId),
            subscriptionStatus: user.subscriptionStatus,
            // The brokerage pays for this member's plan
            paidByCompany: companyLevel(user, user.organization) !== null,
            // A plan is needed now (blocked until one is chosen)
            planRequired: planRequired(user, internalMembers, start),
            // Still free for now, but a plan will be needed on this date
            graceEndsAt: start && inTeam && isBillableRole(user.role) && user.tier === 'CORE' && !trial && grace && grace.getTime() > Date.now() ? grace.toISOString() : null,
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

        const user = await prisma.user.findUnique({ where: { id: req.user.userId }, include: { organization: { select: { companyPlan: true, stripeSubscriptionId: true, subscriptionStatus: true } } } });
        if (!user) return res.status(404).json({ error: 'User not found' });

        // One subscription per member: a second checkout would bill twice. Changes go through the billing page.
        if (user.stripeSubscriptionId && user.selfTier !== 'CORE') {
            return res.status(409).json({ error: 'You already have a subscription. Use Manage billing to change or cancel it.' });
        }
        // Paying personally for something the brokerage already pays for would charge twice
        if (companyLevel(user, user.organization)) {
            return res.status(409).json({ error: 'Your brokerage pays for your plan. Ask your admin to change your level.' });
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
// even if the webhook has not arrived yet. The session must be the caller's own, or their brokerage's.
router.post('/confirm', authenticateToken, async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });
        const sessionId = req.body?.sessionId;
        if (typeof sessionId !== 'string' || !/^cs_[A-Za-z0-9_]{8,200}$/.test(sessionId)) {
            return res.status(400).json({ error: 'Invalid checkout session' });
        }
        const session = await stripe.checkout.sessions.retrieve(sessionId, { expand: ['subscription'] });
        const md = session.metadata || {};
        const mine = md.orgId ? md.orgId === req.user.orgId : md.userId === req.user.userId;
        if (!mine) return res.status(400).json({ error: 'Invalid checkout session' });
        await applyCheckoutSession(session);
        const me = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { tier: true } });
        res.json({ applied: true, tier: me?.tier });
    } catch (error: any) {
        console.error('Stripe confirm error:', error?.message || error);
        res.status(400).json({ error: 'Invalid checkout session' });
    }
});

// ── The brokerage pays for its members ───────────────────────────────────────
const companyAdmin = authorizeRole(COMPANY_ADMINS);

// GET /api/payments/company — what the brokerage pays for: every internal member and their level
router.get('/company', authenticateToken, companyAdmin, async (req: AuthRequest, res) => {
    try {
        const org = await prisma.organization.findUnique({ where: { id: req.user!.orgId }, select: { companyPlan: true, companyCycle: true, stripeSubscriptionId: true, subscriptionStatus: true } });
        if (!org) return res.status(404).json({ error: 'Organization not found' });
        const members = await prisma.user.findMany({
            where: { orgId: req.user!.orgId, isActive: true, role: { notIn: FREE_ROLES as any } },
            select: { id: true, name: true, email: true, role: true, tier: true, companyTier: true, stripeSubscriptionId: true },
            orderBy: { name: 'asc' },
        });
        const active = companyPays(org);
        const fallback: PaidTier = org.companyPlan === 'ELITE' ? 'ELITE' : 'PRO';
        res.json({
            active,
            plan: active ? fallback : null,
            cycle: active ? (org.companyCycle === 'ANNUAL' ? 'ANNUAL' : 'MONTHLY') : null,
            status: org.subscriptionStatus,
            seats: active ? await companySeats(req.user!.orgId, org) : { PRO: 0, ELITE: 0 },
            members: members.map(m => ({
                id: m.id, name: m.name, email: m.email, role: m.role, tier: m.tier,
                level: (m.companyTier || fallback) === 'ELITE' ? 'ELITE' : 'PRO', // the level the brokerage pays (or would pay) for this member
                paysForSelf: Boolean(m.stripeSubscriptionId),
            })),
        });
    } catch (error) {
        console.error('Company billing error:', error);
        res.status(500).json({ error: 'Failed to load billing status' });
    }
});

// POST /api/payments/company/checkout — the brokerage starts paying for all its internal members
router.post('/company/checkout', authenticateToken, companyAdmin, async (req: AuthRequest, res) => {
    try {
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured. Set STRIPE_SECRET_KEY.' });
        const plan: PaidTier | null = req.body?.plan === 'ELITE' ? 'ELITE' : req.body?.plan === 'PRO' ? 'PRO' : null;
        const cycle: Cycle | null = req.body?.cycle === 'ANNUAL' ? 'ANNUAL' : req.body?.cycle === 'MONTHLY' ? 'MONTHLY' : null;
        if (!plan || !cycle) return res.status(400).json({ error: 'Invalid plan ID' });

        const [org, admin] = await Promise.all([
            prisma.organization.findUnique({ where: { id: req.user!.orgId } }),
            prisma.user.findUnique({ where: { id: req.user!.userId }, select: { email: true } }),
        ]);
        if (!org || !admin) return res.status(404).json({ error: 'Organization not found' });
        if (companyPays(org)) return res.status(409).json({ error: 'Your brokerage already pays for its members. Use Manage billing to change or cancel it.' });

        // One line per level, for the seats the brokerage has today (members keep a level the admin already chose)
        const seats = await companySeats(org.id, { ...org, companyPlan: plan });
        const line_items: { price: string; quantity: number }[] = [];
        for (const level of ['PRO', 'ELITE'] as PaidTier[]) {
            if (!seats[level]) continue;
            const price = PLAN_PRICES[`${level}_${cycle}`];
            if (!price) return res.status(400).json({ error: 'Invalid plan ID' });
            line_items.push({ price, quantity: seats[level] });
        }
        if (!line_items.length) return res.status(400).json({ error: 'Invalid plan ID' });

        let customerId = org.stripeCustomerId;
        if (!customerId) {
            const customer = await stripe.customers.create({ email: admin.email, name: org.name, metadata: { orgId: org.id } });
            customerId = customer.id;
            await prisma.organization.update({ where: { id: org.id }, data: { stripeCustomerId: customerId } });
        }

        const appUrl = getAppUrl();
        const metadata = { orgId: org.id, companyPlan: plan, companyCycle: cycle };
        const session = await stripe.checkout.sessions.create({
            mode: 'subscription',
            customer: customerId,
            line_items,
            success_url: `${appUrl}/upgrade?success=true&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${appUrl}/upgrade?canceled=true`,
            client_reference_id: org.id,
            metadata,
            subscription_data: { metadata },
        });
        res.json({ sessionId: session.id, url: session.url });
    } catch (error: any) {
        console.error('Stripe company checkout error:', error);
        res.status(500).json({ error: 'Checkout failed. Please try again or contact support.' });
    }
});

// PATCH /api/payments/company/members/:id — choose the level the brokerage pays for one member
router.patch('/company/members/:id', authenticateToken, companyAdmin, async (req: AuthRequest, res) => {
    try {
        const level: PaidTier | null = req.body?.level === 'ELITE' ? 'ELITE' : req.body?.level === 'PRO' ? 'PRO' : null;
        if (!level) return res.status(400).json({ error: 'Invalid plan ID' });
        const member = await prisma.user.findFirst({ where: { id: String(req.params.id), orgId: req.user!.orgId, isActive: true } });
        if (!member || !isBillableRole(member.role)) return res.status(404).json({ error: 'User not found' });
        await prisma.user.update({ where: { id: member.id }, data: { companyTier: level } });
        await companyChanged(req.user!.orgId);
        const updated = await prisma.user.findUnique({ where: { id: member.id }, select: { id: true, tier: true, companyTier: true } });
        res.json({ id: member.id, level, tier: updated?.tier });
    } catch (error) {
        console.error('Company level error:', error);
        res.status(500).json({ error: 'Failed to load billing status' });
    }
});

// GET /api/payments/company/portal — Stripe Customer Portal for the brokerage's subscription
router.get('/company/portal', authenticateToken, companyAdmin, async (req: AuthRequest, res) => {
    try {
        if (!stripe) return res.status(503).json({ error: 'Payment service not configured' });
        const org = await prisma.organization.findUnique({ where: { id: req.user!.orgId }, select: { stripeCustomerId: true } });
        if (!org?.stripeCustomerId) return res.status(400).json({ error: 'There is no paid subscription to manage yet.' });
        const portalSession = await stripe.billingPortal.sessions.create({ customer: org.stripeCustomerId, return_url: `${getAppUrl()}/upgrade` });
        res.json({ url: portalSession.url });
    } catch (error: any) {
        console.error('Company portal error:', error);
        res.status(500).json({ error: 'Failed to open the billing portal. Please try again.' });
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
