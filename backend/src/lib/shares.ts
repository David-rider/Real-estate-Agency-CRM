import crypto from 'crypto';

// Rules for shared document packages (pure functions, so they can be checked without a server).

export const MAX_DOCUMENTS_PER_PACKAGE = 20;
export const MAX_NDA_LENGTH = 20000;
export const MAX_MESSAGE_LENGTH = 2000;
export const MAX_TITLE_LENGTH = 200;

// Link and viewing-session tokens: 24 random bytes, URL-safe
export const newShareToken = () => crypto.randomBytes(24).toString('base64url');
export const isShareToken = (v: unknown): v is string => typeof v === 'string' && /^[A-Za-z0-9_-]{32}$/.test(v);

export interface LinkState { revokedAt: Date | null; expiresAt: Date | null }
// A link works until it is revoked or its expiry has passed
export function linkUsable(link: LinkState, now = new Date()): boolean {
    if (link.revokedAt) return false;
    return !link.expiresAt || link.expiresAt.getTime() > now.getTime();
}

export const normalizeEmail = (v: unknown): string | null => {
    if (typeof v !== 'string') return null;
    const e = v.trim().toLowerCase();
    return e.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e) ? e : null;
};

export interface Gate { requireEmail: boolean; requireNda: boolean; recipientEmail: string | null }
// Checks what a viewer sent before seeing the documents. Returns the error code, or null when they may view.
// A link made for one recipient only opens for that email address.
export function gateError(gate: Gate, body: { email?: unknown; ndaAccepted?: unknown }): 'EMAIL_REQUIRED' | 'WRONG_RECIPIENT' | 'NDA_REQUIRED' | null {
    const email = normalizeEmail(body.email);
    if ((gate.requireEmail || gate.recipientEmail) && !email) return 'EMAIL_REQUIRED';
    if (gate.recipientEmail && email !== gate.recipientEmail.toLowerCase()) return 'WRONG_RECIPIENT';
    if (gate.requireNda && body.ndaAccepted !== true) return 'NDA_REQUIRED';
    return null;
}

// Settings for a new link, from what the agent sent (unknown values fall back to the safe defaults)
export interface LinkSettings {
    recipientEmail: string | null; requireEmail: boolean; requireNda: boolean; ndaText: string | null;
    watermark: boolean; allowDownload: boolean; expiresAt: Date | null;
}
export function linkSettings(body: any, now = new Date()): LinkSettings | { error: string } {
    const recipientEmail = body?.recipientEmail ? normalizeEmail(body.recipientEmail) : null;
    if (body?.recipientEmail && !recipientEmail) return { error: 'Please enter a valid email address' };
    const requireNda = body?.requireNda === true;
    const ndaText = typeof body?.ndaText === 'string' ? body.ndaText.trim().slice(0, MAX_NDA_LENGTH) : '';
    if (requireNda && !ndaText) return { error: 'Please enter the confidentiality agreement text' };
    let expiresAt: Date | null = null;
    if (body?.expiresAt) {
        expiresAt = new Date(body.expiresAt);
        if (isNaN(expiresAt.getTime()) || expiresAt.getTime() <= now.getTime()) return { error: 'The expiry must be in the future' };
    }
    return {
        recipientEmail,
        requireEmail: body?.requireEmail !== false, // on unless switched off
        requireNda,
        ndaText: requireNda ? ndaText : null,
        watermark: body?.watermark !== false,       // on unless switched off
        allowDownload: body?.allowDownload === true, // off unless switched on
        expiresAt,
    };
}
