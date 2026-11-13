import crypto from 'crypto';
import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';
import { orgSlug } from './slug';
import { issueSession } from './session';
import { signChallenge } from './totp';
import { ipAllowed, IP_BLOCKED } from './ipAllowlist';

/*
 * Social sign-in (Google today; Apple ready for when a developer account exists).
 * A verified identity signs into the account linked to it; if none is linked yet and an account with the
 * same email exists, it is linked automatically when the provider says the email is verified.
 * New emails get their own brokerage, exactly like email sign-up. 2FA, deactivation and the IP allowlist still apply.
 */

export type Provider = 'google' | 'apple';
export interface SocialIdentity { provider: Provider; subject: string; email: string; emailVerified: boolean; name?: string }

export class SocialAuthError extends Error {
    constructor(public status: number, message: string, public code?: string) { super(message); }
}

// ── Google ──────────────────────────────────────────────────────────────────

export async function verifyGoogle(body: Record<string, unknown>): Promise<SocialIdentity> {
    const idToken = typeof body.idToken === 'string' ? body.idToken : '';
    if (!idToken) throw new SocialAuthError(400, 'Google ID token is required');
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (clientId) {
        try {
            const ticket = await new OAuth2Client(clientId).verifyIdToken({ idToken, audience: clientId });
            const p = ticket.getPayload();
            if (!p?.email || !p.sub) throw new Error('no email');
            return { provider: 'google', subject: p.sub, email: p.email.toLowerCase(), emailVerified: p.email_verified === true, name: p.name };
        } catch {
            throw new SocialAuthError(401, 'Invalid Google token');
        }
    }
    if (process.env.NODE_ENV === 'production') throw new SocialAuthError(503, 'Google sign-in is not available yet.');
    // Development only (never in production): a mock identity so the flow can be tested without Google
    if (typeof body.email !== 'string' || typeof body.googleId !== 'string') throw new SocialAuthError(400, 'Dev mode: email and googleId required');
    return { provider: 'google', subject: body.googleId, email: body.email.toLowerCase(), emailVerified: body.emailVerified !== false, name: typeof body.name === 'string' ? body.name : undefined };
}

// ── Apple ───────────────────────────────────────────────────────────────────

let appleKeys: { at: number; keys: Array<Record<string, string>> } | null = null;
async function appleJwks(): Promise<Array<Record<string, string>>> {
    if (appleKeys && Date.now() - appleKeys.at < 6 * 60 * 60 * 1000) return appleKeys.keys;
    const r = await fetch('https://appleid.apple.com/auth/keys');
    if (!r.ok) throw new Error('Apple keys unavailable');
    const keys = ((await r.json()) as { keys: Array<Record<string, string>> }).keys;
    appleKeys = { at: Date.now(), keys };
    return keys;
}

export async function verifyApple(body: Record<string, unknown>): Promise<SocialIdentity> {
    const clientId = process.env.APPLE_CLIENT_ID;
    if (!clientId) throw new SocialAuthError(503, 'Apple sign-in is not available yet.');
    const token = typeof body.identityToken === 'string' ? body.identityToken : '';
    if (!token) throw new SocialAuthError(400, 'Apple identity token is required');
    try {
        const header = JSON.parse(Buffer.from(token.split('.')[0], 'base64url').toString('utf8')) as { kid?: string };
        const jwk = (await appleJwks()).find((k) => k.kid === header.kid);
        if (!jwk) throw new Error('unknown key');
        const key = crypto.createPublicKey({ key: jwk as any, format: 'jwk' });
        const p = jwt.verify(token, key, { algorithms: ['RS256'], audience: clientId, issuer: 'https://appleid.apple.com' }) as jwt.JwtPayload;
        if (!p.sub || typeof p.email !== 'string') throw new Error('no email');
        // Apple sends the name only on the very first sign-in, in the request body
        const u = body.user as { name?: { firstName?: string; lastName?: string } } | undefined;
        const name = [u?.name?.firstName, u?.name?.lastName].filter(Boolean).join(' ') || undefined;
        return { provider: 'apple', subject: p.sub, email: p.email.toLowerCase(), emailVerified: p.email_verified === true || p.email_verified === 'true', name };
    } catch {
        throw new SocialAuthError(401, 'Invalid Apple token');
    }
}

// ── Sign in / link ──────────────────────────────────────────────────────────

const idField = (p: Provider) => (p === 'google' ? 'googleId' : 'appleId');

async function auditDirect(prisma: PrismaClient, req: express.Request, userId: string, orgId: string, action: string, after: unknown) {
    try {
        await prisma.auditLog.create({
            data: {
                action, entity: 'User', entityId: userId, before: null, after: JSON.stringify(after),
                ipAddress: req.ip ?? null, userAgent: (req.headers['user-agent'] as string | undefined)?.slice(0, 300) ?? null, userId, orgId,
            },
        });
    } catch (err) {
        console.error(`Audit write failed for ${action}:`, err);
    }
}

export async function signInWithIdentity(prisma: PrismaClient, req: express.Request, res: express.Response, id: SocialIdentity) {
    const field = idField(id.provider);
    let user = await prisma.user.findFirst({ where: { [field]: id.subject } });
    if (!user) {
        const existing = await prisma.user.findFirst({ where: { email: { equals: id.email, mode: 'insensitive' } } });
        if (existing) {
            // Same email, not linked yet: link only when the provider has verified the email
            if (!id.emailVerified) throw new SocialAuthError(409, 'An account with this email already exists. Please log in with your password and link Google from account settings.');
            if (existing[field] && existing[field] !== id.subject) throw new SocialAuthError(409, 'An account with this email already exists. Please log in with your password and link Google from account settings.');
            user = await prisma.user.update({ where: { id: existing.id }, data: { [field]: id.subject, emailVerified: true } });
            await auditDirect(prisma, req, user.id, user.orgId, id.provider === 'google' ? 'LINK_GOOGLE' : 'LINK_APPLE', { automatic: true });
        } else {
            // First sign-in creates the person's own brokerage; joining one only happens through an invitation
            const display = id.name || id.email.split('@')[0];
            const org = await prisma.organization.create({ data: { name: `${display}'s Brokerage`, slug: orgSlug(display) } });
            user = await prisma.user.create({
                data: { name: display, email: id.email, [field]: id.subject, role: 'FIRMADMIN', tier: 'CORE', emailVerified: true, orgId: org.id },
            });
        }
    }
    if (!user.isActive) throw new SocialAuthError(403, 'This account has been deactivated. Contact your administrator.');
    const org = await prisma.organization.findUnique({ where: { id: user.orgId }, select: { ipAllowlist: true } });
    if (org && !ipAllowed(org.ipAllowlist, req.ip ?? '')) throw new SocialAuthError(403, IP_BLOCKED.error, IP_BLOCKED.code);
    if (user.totpEnabled) return res.json({ twoFactorRequired: true, challenge: signChallenge(user.id) });
    issueSession(prisma, req, res, user);
}

export function sendSocialError(res: express.Response, err: unknown, label: string) {
    if (err instanceof SocialAuthError) return res.status(err.status).json({ error: err.message, ...(err.code ? { code: err.code } : {}) });
    console.error(`${label} error:`, err);
    res.status(500).json({ error: 'Internal server error' });
}
