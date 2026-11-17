import express from 'express';
import rateLimit, { ipKeyGenerator } from 'express-rate-limit';
import { prisma } from '../server';
import { createSignedPrivateFileToken } from '../lib/storage';
import { getRequestBaseUrl } from './documents';
import { gateError, isShareToken, linkUsable, newShareToken, normalizeEmail, addPageSeconds } from '../lib/shares';
import { createNotification } from './notifications';

// Shared document packages, viewer side: no account needed (mounted without authentication).
// File addresses are only handed out after the viewer passed the link's gate (email / NDA), and expire in 10 minutes.
const router = express.Router();

const shareLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 120,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
// (shareLimiter guards opening a link; page reports have their own limit below)

// Time-per-page reports come every 15 seconds; limited per viewing session as well as per address
const pageLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: 'draft-7',
    legacyHeaders: false,
    keyGenerator: (req) => (isShareToken(req.body?.session) ? `s:${req.body.session}` : `ip:${ipKeyGenerator(req.ip || '')}`),
    message: { error: 'Too many requests, please try again later.' },
});

const NOT_FOUND = { error: 'This link is not available.', code: 'SHARE_NOT_FOUND' };
const GATE_TEXT: Record<string, string> = {
    EMAIL_REQUIRED: 'Please enter your email address to view these documents.',
    WRONG_RECIPIENT: 'This link was sent to a different email address.',
    NDA_REQUIRED: 'Please accept the confidentiality agreement to continue.',
};

// A usable link with its package and documents; null for an unknown, revoked or expired link (all look the same)
async function usableLink(token: unknown) {
    if (!isShareToken(token)) return null;
    const link = await prisma.shareLink.findUnique({
        where: { token },
        include: {
            package: {
                include: {
                    documents: {
                        orderBy: { position: 'asc' },
                        include: { document: { select: { id: true, name: true, url: true, mimeType: true, storageKey: true, orgId: true } } },
                    },
                },
            },
        },
    });
    if (!link || !linkUsable(link)) return null;
    return link;
}
type UsableLink = NonNullable<Awaited<ReturnType<typeof usableLink>>>;

// The documents of a link with 10-minute addresses (private uploads are signed; external links are passed through)
function filesOf(req: express.Request, link: UsableLink) {
    const base = getRequestBaseUrl(req);
    return link.package.documents
        .filter(d => d.document.orgId === link.orgId)
        .map(({ document: d }) => {
            if (!d.storageKey) return { id: d.id, name: d.name, mimeType: d.mimeType, url: d.url, downloadUrl: link.allowDownload ? d.url : null };
            const { exp, sig } = createSignedPrivateFileToken(d.storageKey, link.orgId, 600);
            const url = `${base}/api/uploads/private/${d.storageKey}?exp=${exp}&sig=${sig}`;
            return { id: d.id, name: d.name, mimeType: d.mimeType, url, downloadUrl: link.allowDownload ? `${url}&download=1` : null };
        });
}

// GET /api/public/shares/:token — what the viewer needs before opening (never any file address)
router.get('/:token', shareLimiter, async (req, res) => {
    const link = await usableLink(req.params.token);
    if (!link) return res.status(404).json(NOT_FOUND);
    const org = await prisma.organization.findUnique({ where: { id: link.orgId }, select: { name: true, logoUrl: true } });
    res.json({
        brokerage: { name: org?.name ?? '', logoUrl: org?.logoUrl ?? null },
        title: link.package.title,
        message: link.package.message,
        documents: link.package.documents.map(d => ({ id: d.document.id, name: d.document.name, mimeType: d.document.mimeType })),
        requireEmail: link.requireEmail || Boolean(link.recipientEmail),
        requireNda: link.requireNda,
        ndaText: link.requireNda ? link.ndaText : null,
        watermark: link.watermark,
        allowDownload: link.allowDownload,
    });
});

// POST /api/public/shares/:token/view { email?, ndaAccepted? } — passes the gate and starts a viewing session
router.post('/:token/view', shareLimiter, async (req, res) => {
    const link = await usableLink(req.params.token);
    if (!link) return res.status(404).json(NOT_FOUND);
    const code = gateError(link, req.body || {});
    if (code) return res.status(400).json({ error: GATE_TEXT[code], code });
    const view = await prisma.shareView.create({
        data: {
            linkId: link.id, orgId: link.orgId, sessionToken: newShareToken(),
            viewerEmail: normalizeEmail(req.body?.email),
            ndaAcceptedAt: link.requireNda ? new Date() : null,
            ip: (req.ip || '').slice(0, 64) || null,
            userAgent: String(req.headers['user-agent'] || '').slice(0, 300) || null,
        },
    });
    // The first view of a link tells the person who shared it (in the app)
    if ((await prisma.shareView.count({ where: { linkId: link.id } })) === 1) {
        await createNotification(link.package.createdById, link.orgId, 'SYSTEM', // never throws
            { key: 'sharePackageOpened', params: { title: link.package.title, viewer: view.viewerEmail } }, undefined, '/documents');
    }
    res.status(201).json({ session: view.sessionToken, files: filesOf(req, link) });
});

// POST /api/public/shares/:token/pages { session, docId, page, seconds } — time spent on one page
router.post('/:token/pages', pageLimiter, async (req, res) => {
    const link = await usableLink(req.params.token);
    if (!link) return res.status(404).json(NOT_FOUND);
    const session = req.body?.session;
    const view = isShareToken(session) ? await prisma.shareView.findUnique({ where: { sessionToken: session } }) : null;
    if (!view || view.linkId !== link.id) return res.status(401).json({ error: 'Your viewing session has ended. Please open the link again.', code: 'SHARE_SESSION' });
    const docId = typeof req.body?.docId === 'string' ? req.body.docId : '';
    if (!link.package.documents.some(d => d.document.id === docId)) return res.status(400).json({ error: 'Document not found' });
    const next = addPageSeconds(view.pages, docId, req.body?.page, req.body?.seconds);
    if (!next) return res.status(400).json({ error: 'Invalid request' });
    await prisma.shareView.update({
        where: { id: view.id },
        data: { pages: next.pages, totalSeconds: { increment: next.added }, lastSeenAt: new Date() },
    });
    res.json({ ok: true });
});

// POST /api/public/shares/:token/files { session } — fresh addresses once the 10 minutes have passed
router.post('/:token/files', shareLimiter, async (req, res) => {
    const link = await usableLink(req.params.token);
    if (!link) return res.status(404).json(NOT_FOUND);
    const session = req.body?.session;
    const view = isShareToken(session) ? await prisma.shareView.findUnique({ where: { sessionToken: session } }) : null;
    if (!view || view.linkId !== link.id) return res.status(401).json({ error: 'Your viewing session has ended. Please open the link again.', code: 'SHARE_SESSION' });
    await prisma.shareView.update({ where: { id: view.id }, data: { lastSeenAt: new Date() } });
    res.json({ files: filesOf(req, link) });
});

export default router;
