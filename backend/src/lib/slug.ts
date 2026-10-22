import crypto from 'crypto';

// Matches the SQL backfill in 20261023000100_organization_public_slug
export function orgSlug(name: string, id?: string) {
    const base = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40) || 'brokerage';
    const suffix = id ? id.replace(/-/g, '').slice(0, 6) : crypto.randomBytes(3).toString('hex');
    return `${base}-${suffix}`;
}
