import Stripe from 'stripe';

// Billing is PER MEMBER: each internal member of a brokerage pays for their own plan (Pro or Elite).
// Working alone is free (Core). Once a brokerage has two or more internal members, each of them
// needs a paid plan. Outside collaborators (attorney, lender, title company) are always free.

export const stripe = process.env.STRIPE_SECRET_KEY
    ? new Stripe(process.env.STRIPE_SECRET_KEY)
    : null;

// Roles that never need a paid plan: the platform admin and outside collaborators
export const FREE_ROLES = ['SUPERADMIN', 'ATTORNEY', 'LENDER', 'TITLECO'];
export const isBillableRole = (role: string) => !FREE_ROLES.includes(role);

// Accounts that existed before billing started get this long to choose a plan
export const GRACE_DAYS = 30;

// New brokerages get a free Elite trial for every internal member. TRIAL_DAYS (default 14) sets its length; 0 turns it off.
export function trialDays(env: NodeJS.ProcessEnv = process.env): number {
    const raw = env.TRIAL_DAYS;
    if (raw === undefined || raw.trim() === '') return 14;
    const n = Number(raw);
    return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 90) : 0;
}

// When a brokerage created now ends its trial; null = no trial
export function newTrialEnd(now = new Date(), env: NodeJS.ProcessEnv = process.env): Date | null {
    const days = trialDays(env);
    return days > 0 ? new Date(now.getTime() + days * 24 * 60 * 60 * 1000) : null;
}

// True while the brokerage's trial gives this member Elite (outside collaborators and deactivated members get nothing)
export function onTrial(u: { role: string; isActive: boolean }, org: { trialEndsAt: Date | null }, now = new Date()): boolean {
    return Boolean(org.trialEndsAt && org.trialEndsAt.getTime() > now.getTime() && u.isActive && isBillableRole(u.role));
}

// The day paid plans became required. Nothing is enforced unless Stripe is configured AND this date
// is set and has passed — a member can never be locked out while there is no way to pay.
export function billingStart(now = new Date(), env: NodeJS.ProcessEnv = process.env): Date | null {
    if (!env.STRIPE_SECRET_KEY || !env.BILLING_START_DATE) return null;
    const start = new Date(env.BILLING_START_DATE);
    if (isNaN(start.getTime()) || start.getTime() > now.getTime()) return null;
    return start;
}

export interface BillingSubject { role: string; tier: string; createdAt: Date }

// End of the grace period for an account that existed before billing started; null = no grace period
export function graceEndsAt(u: BillingSubject, start: Date | null): Date | null {
    if (!start || u.createdAt.getTime() >= start.getTime()) return null;
    return new Date(start.getTime() + GRACE_DAYS * 24 * 60 * 60 * 1000);
}

// True when this member would have to pay to work in a team right now (ignores team size)
export function mustPay(u: BillingSubject, start: Date | null, now = new Date()): boolean {
    if (!start) return false;
    if (!isBillableRole(u.role) || u.tier !== 'CORE') return false;
    const grace = graceEndsAt(u, start);
    return !grace || now.getTime() > grace.getTime();
}

// True when the member is blocked until they choose a plan: unpaid, and in a brokerage of two or more internal members
export function planRequired(u: BillingSubject, internalMembers: number, start: Date | null, now = new Date()): boolean {
    return internalMembers > 1 && mustPay(u, start, now);
}

// While a plan is required, only these parts of the API stay open: paying, signing in/out, and the member's own profile
export function openWhilePlanRequired(url: string): boolean {
    const path = url.split('?')[0];
    return path.startsWith('/api/payments') || path.startsWith('/api/auth') || path === '/api/settings/profile';
}

export const PLAN_REQUIRED = {
    error: 'A paid plan is required to work in a team. Choose Pro or Elite to continue.',
    code: 'PLAN_REQUIRED',
};

// Email reminders before the grace period ends: at 14, 7, 3 and 1 days left, then once when a plan has become required (stage 0).
// Returns the stage to send now, or null. `lastStage` is the stage already sent (null = none yet), so each is sent once
// and a member who first qualifies late only gets the reminder that fits the time left.
export const REMINDER_STAGES = [14, 7, 3, 1, 0];
export function reminderStage(graceEnd: Date, lastStage: number | null, now = new Date()): number | null {
    const daysLeft = Math.ceil((graceEnd.getTime() - now.getTime()) / (24 * 60 * 60 * 1000));
    if (daysLeft < -2) return null; // long past: no late surprise emails
    const due = daysLeft <= 0 ? 0 : [...REMINDER_STAGES].reverse().find(stage => stage > 0 && daysLeft <= stage);
    if (due === undefined) return null; // more than 14 days left
    return lastStage === null || due < lastStage ? due : null;
}

// A brokerage's subscription has one line per level (Pro, Elite), with one seat per internal member at that level.
// Returns the changes that make the subscription charge for `seats`; an empty list means it is already right.
export interface SeatLine { id: string; price: string; quantity: number }
export type SeatChange = { id: string; quantity: number } | { id: string; deleted: true } | { price: string; quantity: number };
export function seatChanges(lines: SeatLine[], seats: Record<string, number>, prices: Record<string, string | undefined>): SeatChange[] {
    const changes: SeatChange[] = [];
    for (const level of Object.keys(seats)) {
        const price = prices[level];
        if (!price) continue;
        const want = seats[level];
        const line = lines.find(l => l.price === price);
        if (line && line.quantity === want) continue;
        if (line) changes.push(want > 0 ? { id: line.id, quantity: want } : { id: line.id, deleted: true });
        else if (want > 0) changes.push({ price, quantity: want });
    }
    return changes;
}

// When brokerage-paid seats are next checked against Stripe: once a day, and an hour after a run that had failures
export function nextReconcileAt(ranAt: number, failed: number): number {
    return ranAt + (failed > 0 ? 1 : 24) * 60 * 60 * 1000;
}
