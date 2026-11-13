import { appUrl as getAppUrl } from './appUrl';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendEmail, loginAlertEmail } from './email';
import { EMAIL, normalizeLang } from './messages';

const MAX_DEVICES = 10;

/** Rough, human-readable "browser on OS" from a user-agent string. */
export function describeDevice(ua: string): string {
    const browser =
        /Edg\//.test(ua) ? 'Edge' :
        /OPR\/|Opera/.test(ua) ? 'Opera' :
        /Chrome\//.test(ua) ? 'Chrome' :
        /Firefox\//.test(ua) ? 'Firefox' :
        /Safari\//.test(ua) ? 'Safari' : 'Unknown browser';
    const os =
        /iPhone|iPad|iPod/.test(ua) ? 'iOS' :
        /Android/.test(ua) ? 'Android' :
        /Windows/.test(ua) ? 'Windows' :
        /Mac OS X|Macintosh/.test(ua) ? 'macOS' :
        /Linux/.test(ua) ? 'Linux' : 'unknown system';
    return `${browser} · ${os}`;
}

/** Network part of the address (IPv4 /24, IPv6 first 4 groups), so a changing last octet is still "the same place". */
function network(ip: string): string {
    const v4 = ip.replace(/^::ffff:/, '');
    if (/^\d+\.\d+\.\d+\.\d+$/.test(v4)) return v4.split('.').slice(0, 3).join('.');
    return ip.split(':').slice(0, 4).join(':');
}

export function deviceKey(ua: string, ip: string): string {
    return crypto.createHash('sha256').update(`${describeDevice(ua)}|${network(ip)}`).digest('hex').slice(0, 32);
}

/**
 * Remember the device a user just signed in from and, if it is new and the user
 * keeps login alerts on, email them. The first device ever seen is recorded silently.
 * Never throws: a failed alert must not block the sign-in.
 */
export async function recordLogin(prisma: PrismaClient, userId: string, ua: string, ip: string): Promise<void> {
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, name: true, preferredLanguage: true, loginAlerts: true, knownDevices: true },
        });
        if (!user) return;
        const known = Array.isArray(user.knownDevices) ? (user.knownDevices as string[]) : [];
        const key = deviceKey(ua, ip);
        if (known.includes(key)) return;

        await prisma.user.update({
            where: { id: userId },
            data: { knownDevices: [key, ...known].slice(0, MAX_DEVICES) },
        });
        if (known.length === 0 || !user.loginAlerts) return;

        const lang = normalizeLang(user.preferredLanguage);
        const appUrl = getAppUrl();
        await sendEmail({
            to: user.email,
            subject: EMAIL[lang].loginAlert.subject,
            html: loginAlertEmail({ name: user.name, device: describeDevice(ua), ip, when: new Date(), resetUrl: `${appUrl}/forgot-password` }, lang),
            text: `${EMAIL[lang].loginAlert.title}: ${describeDevice(ua)}, ${ip}`,
        });
    } catch (err) {
        console.error('Login alert failed:', err);
    }
}
