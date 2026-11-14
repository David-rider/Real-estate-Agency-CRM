import { Router, Request } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/authMiddleware';
import { audit } from '../lib/audit';
import { appUrl } from '../lib/appUrl';
import {
    SCOPES, calendarPushAvailable, isFakeCalendar, connectWithCode, disconnect, backfill, syncInBackground, fakeEvents,
} from '../lib/googleCalendar';

// Google Calendar push: /api/calendar-sync
const router = Router();
const callbackUrl = (req: Request) => `${req.protocol}://${req.get('host')}/api/calendar-sync/callback`;
const signState = (userId: string) => jwt.sign({ uid: userId, purpose: 'gcal' }, process.env.JWT_SECRET as string, { algorithm: 'HS256', expiresIn: '10m' });

// GET /api/calendar-sync — status for the signed-in user
router.get('/', authenticateToken, async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { gcalRefreshTokenEnc: true, gcalEmail: true } });
    res.json({ available: calendarPushAvailable(), connected: !!u?.gcalRefreshTokenEnc, email: u?.gcalEmail ?? null });
});

// GET /api/calendar-sync/connect — the Google consent URL to open
router.get('/connect', authenticateToken, (req: AuthRequest, res) => {
    if (!calendarPushAvailable()) return res.status(503).json({ error: 'Google Calendar sync is not configured' });
    const state = signState(req.user!.userId);
    if (isFakeCalendar()) return res.json({ url: `${callbackUrl(req)}?code=fake&state=${state}` });
    const q = new URLSearchParams({
        client_id: process.env.GOOGLE_CLIENT_ID || '',
        redirect_uri: callbackUrl(req),
        response_type: 'code',
        scope: SCOPES.join(' '),
        access_type: 'offline',
        prompt: 'consent',
        include_granted_scopes: 'true',
        state,
    });
    res.json({ url: `https://accounts.google.com/o/oauth2/v2/auth?${q}` });
});

// GET /api/calendar-sync/callback — Google redirects here (public; identified by the signed state)
router.get('/callback', async (req, res) => {
    const back = (result: string) => res.redirect(`${appUrl()}/appointments?gcal=${result}`);
    try {
        const { code, state, error } = req.query as Record<string, string | undefined>;
        if (error) return back('denied');
        const payload = jwt.verify(String(state), process.env.JWT_SECRET as string, { algorithms: ['HS256'] }) as { uid?: string; purpose?: string };
        if (payload.purpose !== 'gcal' || !payload.uid || !code) return back('error');
        const user = await prisma.user.findUnique({ where: { id: payload.uid }, select: { id: true, orgId: true, isActive: true } });
        if (!user?.isActive) return back('error');
        await connectWithCode(user.id, code, callbackUrl(req));
        await prisma.auditLog.create({ data: { userId: user.id, orgId: user.orgId, action: 'CONNECT_GOOGLE_CALENDAR', entity: 'User', entityId: user.id } }).catch(() => undefined);
        syncInBackground(() => backfill(user.id));
        back('connected');
    } catch (err) {
        console.warn('[google-calendar] connect failed:', err instanceof Error ? err.message : err);
        back('error');
    }
});

// DELETE /api/calendar-sync — disconnect (events already in Google stay there)
router.delete('/', authenticateToken, async (req: AuthRequest, res) => {
    await disconnect(req.user!.userId);
    await audit(req, 'DISCONNECT_GOOGLE_CALENDAR', 'User', req.user!.userId);
    res.json({ connected: false });
});

// GET /api/calendar-sync/fake-events — development only: what the fake calendar holds for me
router.get('/fake-events', authenticateToken, (req: AuthRequest, res) => {
    if (!isFakeCalendar()) return res.status(404).json({ error: 'Not found' });
    res.json([...fakeEvents.values()].filter(e => e.owner === req.user!.userId));
});

export default router;
