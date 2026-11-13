import { Router, Request } from 'express';
import crypto from 'crypto';
import rateLimit from 'express-rate-limit';
import { prisma } from '../server';
import { AuthRequest, authenticateToken } from '../middleware/authMiddleware';
import { audit } from '../lib/audit';
import { buildIcs } from '../lib/ics';
import { normalizeLang } from '../lib/messages';

const hash = (t: string) => crypto.createHash('sha256').update(t).digest('hex');
const DAY = 24 * 60 * 60 * 1000;
const CAL_NAME: Record<string, string> = { en: 'CRM appointments', 'zh-CN': 'CRM 日程', 'zh-TW': 'CRM 日程', es: 'Citas del CRM' };

// Public base of this API, as the calendar app will fetch it (Render sits behind one proxy; TRUST_PROXY handles the scheme)
const feedUrl = (req: Request, token: string) => `${req.protocol}://${req.get('host')}/api/calendar/${token}.ics`;

// ── Public: GET /api/calendar/:token.ics — read-only feed of the owner's own appointments ──
export const publicFeed = Router();
const feedLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 120, standardHeaders: true, legacyHeaders: false });

publicFeed.get('/:file', feedLimiter, async (req, res) => {
    const m = /^([a-f0-9]{64})\.ics$/.exec(String(req.params.file));
    if (!m) return res.status(404).send('Not found');
    const user = await prisma.user.findUnique({
        where: { calendarFeedTokenHash: hash(m[1]) },
        select: { id: true, orgId: true, isActive: true, preferredLanguage: true },
    });
    if (!user || !user.isActive) return res.status(404).send('Not found');

    const appts = await prisma.appointment.findMany({
        where: { agentId: user.id, orgId: user.orgId, date: { gte: new Date(Date.now() - 60 * DAY), lte: new Date(Date.now() + 400 * DAY) } },
        orderBy: { date: 'asc' },
        take: 2000,
        include: { client: { select: { firstName: true, lastName: true, phone: true } }, property: { select: { address: true } } },
    });
    const ics = buildIcs(CAL_NAME[normalizeLang(user.preferredLanguage)] ?? CAL_NAME.en, appts.map(a => ({
        uid: `${a.id}@real-estate-crm`,
        start: a.date,
        end: a.endDate ?? new Date(a.date.getTime() + (a.durationMin ?? 60) * 60 * 1000),
        summary: a.title,
        location: a.location || a.property?.address || null,
        description: [
            a.client ? `${a.client.firstName} ${a.client.lastName}${a.client.phone ? ` · ${a.client.phone}` : ''}` : '',
            a.property?.address ?? '',
            a.virtualLink ?? '',
            a.notes ?? '',
        ].filter(Boolean).join('\n') || null,
        cancelled: a.status === 'CANCELLED',
        updated: a.updatedAt,
    })));
    res.setHeader('Content-Type', 'text/calendar; charset=utf-8');
    res.setHeader('Cache-Control', 'private, max-age=300');
    res.send(ics);
});

// ── Signed in: /api/settings/calendar-feed ──
export const feedSettings = Router();
feedSettings.use(authenticateToken);

// GET — whether a link exists (the link itself is only shown when it is created)
feedSettings.get('/', async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { calendarFeedTokenHash: true } });
    res.json({ active: !!u?.calendarFeedTokenHash });
});

// POST — create a new link (replaces any previous one, which stops working)
feedSettings.post('/', async (req: AuthRequest, res) => {
    const token = crypto.randomBytes(32).toString('hex');
    await prisma.user.update({ where: { id: req.user!.userId }, data: { calendarFeedTokenHash: hash(token) } });
    await audit(req, 'CREATE_CALENDAR_FEED', 'User', req.user!.userId);
    res.json({ active: true, url: feedUrl(req, token) });
});

// DELETE — turn the link off
feedSettings.delete('/', async (req: AuthRequest, res) => {
    await prisma.user.update({ where: { id: req.user!.userId }, data: { calendarFeedTokenHash: null } });
    await audit(req, 'REVOKE_CALENDAR_FEED', 'User', req.user!.userId);
    res.json({ active: false });
});
