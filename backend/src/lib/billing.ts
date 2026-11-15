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
