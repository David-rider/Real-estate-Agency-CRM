import crypto from 'crypto';
import jwt from 'jsonwebtoken';

/*
 * Two-factor authentication with an authenticator app (TOTP, RFC 6238: SHA-1, 6 digits, 30 s),
 * built on Node's crypto so no extra dependency is needed.
 * Secrets are stored encrypted (AES-256-GCM, key derived from JWT_SECRET); recovery codes only as hashes.
 */

const B32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
const STEP = 30;

export function base32Encode(buf: Buffer): string {
    let bits = 0, value = 0, out = '';
    for (let i = 0; i < buf.length; i++) {
        value = (value << 8) | buf[i];
        bits += 8;
        while (bits >= 5) {
            out += B32[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    if (bits > 0) out += B32[(value << (5 - bits)) & 31];
    return out;
}

export function base32Decode(s: string): Buffer {
    const clean = s.toUpperCase().replace(/[^A-Z2-7]/g, '');
    let bits = 0, value = 0;
    const out: number[] = [];
    for (const ch of clean) {
        value = (value << 5) | B32.indexOf(ch);
        bits += 5;
        if (bits >= 8) {
            out.push((value >>> (bits - 8)) & 255);
            bits -= 8;
        }
    }
    return Buffer.from(out);
}

export const generateSecret = () => base32Encode(crypto.randomBytes(20));

/** The 6-digit code for a given 30-second step. */
export function totpAt(secret: string, step: number): string {
    const counter = Buffer.alloc(8);
    counter.writeBigUInt64BE(BigInt(step));
    const h = crypto.createHmac('sha1', base32Decode(secret)).update(counter).digest();
    const off = h[h.length - 1] & 15;
    const n = ((h[off] & 127) << 24) | (h[off + 1] << 16) | (h[off + 2] << 8) | h[off + 3];
    return String(n % 1_000_000).padStart(6, '0');
}

export const currentStep = (now = Date.now()) => Math.floor(now / 1000 / STEP);

/**
 * Check a code against the current step ±1 (clock drift). Returns the matching step, or null.
 * Callers reject steps at or before the last one used, so a code can't be replayed.
 */
export function verifyTotp(secret: string, code: string, now = Date.now()): number | null {
    const c = String(code ?? '').replace(/\s/g, '');
    if (!/^\d{6}$/.test(c)) return null;
    const s = currentStep(now);
    for (const step of [s - 1, s, s + 1]) {
        const expected = totpAt(secret, step);
        if (crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(c))) return step;
    }
    return null;
}

export function otpauthUrl(secret: string, account: string, issuer = 'Real Estate CRM'): string {
    return `otpauth://totp/${encodeURIComponent(`${issuer}:${account}`)}?secret=${secret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=${STEP}`;
}

// ── Encryption of the stored secret ───────────────────────────────────────────

const key = () => crypto.createHash('sha256').update(`${process.env.JWT_SECRET}:totp-secret`).digest();

export function encryptSecret(secret: string): string {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', key(), iv);
    const enc = Buffer.concat([cipher.update(secret, 'utf8'), cipher.final()]);
    return [iv, cipher.getAuthTag(), enc].map((b) => b.toString('base64')).join('.');
}

export function decryptSecret(stored: string): string {
    const [iv, tag, enc] = stored.split('.').map((p) => Buffer.from(p, 'base64'));
    const decipher = crypto.createDecipheriv('aes-256-gcm', key(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

// ── Recovery codes ────────────────────────────────────────────────────────────

const hashCode = (c: string) => crypto.createHash('sha256').update(c.toUpperCase().replace(/[^A-Z0-9]/g, '')).digest('hex');

/** Ten one-time codes like "K7Q2-M9XD"; returns the codes to show once and the hashes to store. */
export function generateRecoveryCodes(): { codes: string[]; hashes: string[] } {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    const codes = Array.from({ length: 10 }, () => {
        const raw = Array.from(crypto.randomBytes(8), (b) => alphabet[b % alphabet.length]).join('');
        return `${raw.slice(0, 4)}-${raw.slice(4)}`;
    });
    return { codes, hashes: codes.map(hashCode) };
}

/** If `code` is one of the stored recovery codes, returns the remaining hashes (the used one removed). */
export function useRecoveryCode(hashes: string[], code: string): string[] | null {
    const h = hashCode(String(code ?? ''));
    if (!h || !hashes.includes(h)) return null;
    return hashes.filter((x) => x !== h);
}

// ── Sign-in challenge (between the password step and the code step) ─────────────

// A separate signing key: a challenge can never be used as a session token
const challengeKey = () => `${process.env.JWT_SECRET}:2fa-challenge`;

export const signChallenge = (userId: string) =>
    jwt.sign({ sub: userId, purpose: '2fa' }, challengeKey(), { expiresIn: '5m', algorithm: 'HS256' });

export function readChallenge(token: string): string | null {
    try {
        const p = jwt.verify(String(token ?? ''), challengeKey(), { algorithms: ['HS256'] }) as { sub?: string; purpose?: string };
        return p.purpose === '2fa' && p.sub ? p.sub : null;
    } catch {
        return null;
    }
}
