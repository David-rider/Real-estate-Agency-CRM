import net from 'net';

/*
 * Brokerage IP allowlist: when the list is non-empty, members can only sign in and use the
 * API from these addresses or ranges (IPv4/IPv6, single address or CIDR such as 203.0.113.0/24).
 * Emergency switch: DISABLE_IP_ALLOWLIST=true on the server turns enforcement off.
 */

export const MAX_ENTRIES = 50;

/** Strip the IPv4-mapped IPv6 prefix ("::ffff:1.2.3.4" → "1.2.3.4"). */
export function normalizeIp(ip: string): string {
    return String(ip ?? '').trim().replace(/^::ffff:(\d+\.\d+\.\d+\.\d+)$/i, '$1');
}

/** Canonical form of one entry, or null if it is not a valid address / CIDR range. */
export function parseEntry(raw: string): string | null {
    const s = String(raw ?? '').trim();
    if (!s) return null;
    const [addr, bits, extra] = s.split('/');
    if (extra !== undefined) return null;
    const ip = normalizeIp(addr);
    const v = net.isIP(ip);
    if (!v) return null;
    if (bits === undefined) return ip;
    if (!/^\d{1,3}$/.test(bits)) return null;
    const n = Number(bits);
    if (n > (v === 4 ? 32 : 128)) return null;
    return `${ip}/${n}`;
}

export function enforcementDisabled(): boolean {
    return process.env.DISABLE_IP_ALLOWLIST === 'true';
}

/** True when the list is empty (no restriction) or the address matches an entry. */
export function ipAllowed(list: string[] | null | undefined, ip: string): boolean {
    if (!list || list.length === 0 || enforcementDisabled()) return true;
    const addr = normalizeIp(ip);
    const type = net.isIP(addr);
    if (!type) return false;
    const block = new net.BlockList();
    for (const entry of list) {
        const [a, bits] = entry.split('/');
        const t = net.isIP(a) === 6 ? 'ipv6' : 'ipv4';
        try {
            if (bits === undefined) block.addAddress(a, t);
            else block.addSubnet(a, Number(bits), t);
        } catch { /* stored entries are validated on save; skip anything odd */ }
    }
    return block.check(addr, type === 6 ? 'ipv6' : 'ipv4');
}

export const IP_BLOCKED = {
    error: "Access from this network isn't allowed by your brokerage. Contact your administrator.",
    code: 'IP_NOT_ALLOWED',
} as const;
