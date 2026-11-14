import crypto from 'crypto';

/**
 * Encrypts small secrets at rest (e.g. Google refresh tokens) with AES-256-GCM.
 * Key: TOKEN_ENCRYPTION_KEY if set, otherwise derived from JWT_SECRET — rotating it means users reconnect.
 */
function key(): Buffer {
    const base = process.env.TOKEN_ENCRYPTION_KEY || process.env.JWT_SECRET || '';
    if (!base) throw new Error('No encryption key configured');
    return crypto.createHash('sha256').update(`secret-box:${base}`).digest();
}

export function seal(plain: string): string {
    const iv = crypto.randomBytes(12);
    const c = crypto.createCipheriv('aes-256-gcm', key(), iv);
    const data = Buffer.concat([c.update(plain, 'utf8'), c.final()]);
    return ['v1', iv.toString('base64'), c.getAuthTag().toString('base64'), data.toString('base64')].join('.');
}

export function open(sealed: string): string | null {
    try {
        const [v, iv, tag, data] = sealed.split('.');
        if (v !== 'v1') return null;
        const d = crypto.createDecipheriv('aes-256-gcm', key(), Buffer.from(iv, 'base64'));
        d.setAuthTag(Buffer.from(tag, 'base64'));
        return Buffer.concat([d.update(Buffer.from(data, 'base64')), d.final()]).toString('utf8');
    } catch {
        return null;
    }
}
