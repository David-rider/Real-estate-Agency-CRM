import { prisma } from '../server';
import { seal, open } from './secretBox';

/**
 * Google Calendar push: appointments are written to the agent's primary Google Calendar when they
 * are created, changed, cancelled or deleted. Needs GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET.
 * Outside production without a client secret, a fake in-memory calendar is used (local dev / smoke tests).
 */
export const SCOPES = ['openid', 'email', 'https://www.googleapis.com/auth/calendar.events'];
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const CAL_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';

export const isFakeCalendar = () => process.env.NODE_ENV !== 'production' && !process.env.GOOGLE_CLIENT_SECRET;
export const calendarPushAvailable = () => isFakeCalendar() || !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

// Fake calendar for development and the smoke test
export const fakeEvents = new Map<string, Record<string, unknown>>();

type TokenResponse = { access_token?: string; refresh_token?: string; expires_in?: number; id_token?: string; error?: string };

async function tokenRequest(params: Record<string, string>): Promise<TokenResponse> {
    const res = await fetch(TOKEN_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID || '', client_secret: process.env.GOOGLE_CLIENT_SECRET || '', ...params }),
    });
    return (await res.json().catch(() => ({}))) as TokenResponse;
}

const emailFromIdToken = (idToken?: string): string | null => {
    try {
        const payload = JSON.parse(Buffer.from(String(idToken).split('.')[1], 'base64url').toString('utf8'));
        return typeof payload.email === 'string' ? payload.email : null;
    } catch { return null; }
};

/** Exchange the OAuth code and save the (encrypted) refresh token on the user. */
export async function connectWithCode(userId: string, code: string, redirectUri: string): Promise<void> {
    let refresh: string | undefined, email: string | null = null;
    if (isFakeCalendar()) {
        refresh = 'fake-refresh-token'; email = 'calendar@fake.test';
    } else {
        const t = await tokenRequest({ code, redirect_uri: redirectUri, grant_type: 'authorization_code' });
        if (!t.refresh_token) throw new Error(`Google token exchange failed: ${t.error ?? 'no refresh token'}`);
        refresh = t.refresh_token; email = emailFromIdToken(t.id_token);
        if (t.access_token && t.expires_in) accessCache.set(userId, { token: t.access_token, exp: Date.now() + (t.expires_in - 60) * 1000 });
    }
    await prisma.user.update({ where: { id: userId }, data: { gcalRefreshTokenEnc: seal(refresh), gcalEmail: email } });
}

export async function disconnect(userId: string): Promise<void> {
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { gcalRefreshTokenEnc: true } });
    const refresh = u?.gcalRefreshTokenEnc ? open(u.gcalRefreshTokenEnc) : null;
    if (refresh && !isFakeCalendar()) {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(refresh)}`, { method: 'POST' }).catch(() => undefined);
    }
    accessCache.delete(userId);
    await prisma.$transaction([
        prisma.user.update({ where: { id: userId }, data: { gcalRefreshTokenEnc: null, gcalEmail: null } }),
        prisma.appointment.updateMany({ where: { agentId: userId }, data: { gcalEventId: null } }),
    ]);
}

const accessCache = new Map<string, { token: string; exp: number }>();

async function accessToken(userId: string): Promise<string | null> {
    if (isFakeCalendar()) return 'fake-access-token';
    const cached = accessCache.get(userId);
    if (cached && cached.exp > Date.now()) return cached.token;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { gcalRefreshTokenEnc: true } });
    const refresh = u?.gcalRefreshTokenEnc ? open(u.gcalRefreshTokenEnc) : null;
    if (!refresh) return null;
    const t = await tokenRequest({ refresh_token: refresh, grant_type: 'refresh_token' });
    if (t.error === 'invalid_grant') {
        // Access was revoked in the Google account: stop trying until the user reconnects
        await prisma.user.update({ where: { id: userId }, data: { gcalRefreshTokenEnc: null, gcalEmail: null } });
        return null;
    }
    if (!t.access_token) return null;
    accessCache.set(userId, { token: t.access_token, exp: Date.now() + ((t.expires_in ?? 3600) - 60) * 1000 });
    return t.access_token;
}

async function calendarCall(userId: string, method: string, path: string, body?: unknown): Promise<{ status: number; json: Record<string, unknown> }> {
    if (isFakeCalendar()) {
        if (method === 'POST') {
            const id = `fake-${Math.random().toString(36).slice(2, 10)}`;
            fakeEvents.set(id, { ...(body as object), id, owner: userId });
            return { status: 200, json: { id } };
        }
        const id = path.slice(1);
        if (!fakeEvents.has(id)) return { status: 404, json: {} };
        if (method === 'DELETE') { fakeEvents.delete(id); return { status: 204, json: {} }; }
        fakeEvents.set(id, { ...fakeEvents.get(id), ...(body as object) });
        return { status: 200, json: { id } };
    }
    const token = await accessToken(userId);
    if (!token) return { status: 401, json: {} };
    const res = await fetch(`${CAL_URL}${path}`, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

/** Bring Google Calendar in line with one appointment (create, update, or remove when cancelled). */
export async function syncAppointment(appointmentId: string): Promise<void> {
    const a = await prisma.appointment.findUnique({
        where: { id: appointmentId },
        include: {
            agent: { select: { gcalRefreshTokenEnc: true } },
            client: { select: { firstName: true, lastName: true, phone: true } },
            property: { select: { address: true } },
        },
    });
    if (!a || !a.agent.gcalRefreshTokenEnc || !calendarPushAvailable()) return;

    if (a.status === 'CANCELLED') {
        if (a.gcalEventId) {
            await calendarCall(a.agentId, 'DELETE', `/${encodeURIComponent(a.gcalEventId)}`);
            await prisma.appointment.update({ where: { id: a.id }, data: { gcalEventId: null } });
        }
        return;
    }
    const end = a.endDate ?? new Date(a.date.getTime() + (a.durationMin ?? 60) * 60 * 1000);
    const event = {
        summary: a.title,
        location: a.location || a.property?.address || undefined,
        description: [
            a.client ? `${a.client.firstName} ${a.client.lastName}${a.client.phone ? ` · ${a.client.phone}` : ''}` : '',
            a.property?.address ?? '', a.virtualLink ?? '', a.notes ?? '',
        ].filter(Boolean).join('\n') || undefined,
        start: { dateTime: a.date.toISOString() },
        end: { dateTime: end.toISOString() },
        extendedProperties: { private: { crmAppointmentId: a.id } },
    };
    if (a.gcalEventId) {
        const r = await calendarCall(a.agentId, 'PATCH', `/${encodeURIComponent(a.gcalEventId)}`, event);
        if (r.status !== 404 && r.status !== 410) return;
    }
    const r = await calendarCall(a.agentId, 'POST', '', event);
    if (r.status < 300 && typeof r.json.id === 'string') {
        await prisma.appointment.update({ where: { id: a.id }, data: { gcalEventId: r.json.id } });
    }
}

/** Remove a deleted appointment's event (the appointment row is already gone). */
export async function removeEvent(agentId: string, eventId: string | null): Promise<void> {
    if (!eventId || !calendarPushAvailable()) return;
    const u = await prisma.user.findUnique({ where: { id: agentId }, select: { gcalRefreshTokenEnc: true } });
    if (!u?.gcalRefreshTokenEnc) return;
    await calendarCall(agentId, 'DELETE', `/${encodeURIComponent(eventId)}`);
}

/** Push upcoming appointments right after connecting. */
export async function backfill(userId: string): Promise<number> {
    const upcoming = await prisma.appointment.findMany({
        where: { agentId: userId, date: { gte: new Date() }, status: { not: 'CANCELLED' } },
        select: { id: true }, orderBy: { date: 'asc' }, take: 200,
    });
    for (const a of upcoming) await syncAppointment(a.id);
    return upcoming.length;
}

/** Fire-and-forget wrapper for request handlers: calendar trouble never breaks saving an appointment. */
export function syncInBackground(task: () => Promise<unknown>): void {
    task().catch((err) => console.warn('[google-calendar]', err instanceof Error ? err.message : err));
}
