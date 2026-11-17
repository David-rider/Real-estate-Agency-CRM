import express from 'express';
import { prisma } from '../server';
import { AuthRequest, requireTier } from '../middleware/authMiddleware';
import { checkRefs, isManager } from '../lib/access';
import { audit } from '../lib/audit';
import { canAccessDocument } from './documents';
import { newShareToken, linkSettings, linkUsable, MAX_DOCUMENTS_PER_PACKAGE, MAX_MESSAGE_LENGTH, MAX_TITLE_LENGTH } from '../lib/shares';

// Shared document packages, agent side (mounted behind authenticateToken).
// Creating packages and links needs Elite; seeing, revoking and deleting what you already shared works on every plan.
const router = express.Router();

type User = NonNullable<AuthRequest['user']>;
const seesAll = (user: User) => isManager(user) || user.role === 'OFFICE_SUPPORT';

// Managers see every package in the brokerage; everyone else only their own
const packageScope = (user: User) => (seesAll(user) ? { orgId: user.orgId } : { orgId: user.orgId, createdById: user.userId });

const LINK_SELECT = {
    id: true, token: true, recipientEmail: true, requireEmail: true, requireNda: true, ndaText: true, watermark: true,
    allowDownload: true, expiresAt: true, revokedAt: true, createdAt: true,
} as const;

function linkOut(link: any) {
    const { views, ...rest } = link;
    const list = Array.isArray(views) ? views : [];
    return {
        ...rest,
        active: linkUsable(link),
        viewCount: list.length,
        lastViewedAt: list.reduce((m: Date | null, v: any) => (!m || v.lastSeenAt > m ? v.lastSeenAt : m), null),
    };
}

// POST /api/shares { title, message?, documentIds[], propertyId?, clientId?, ...link settings }
router.post('/', requireTier('ELITE'), async (req: AuthRequest, res) => {
    const user = req.user!;
    const title = typeof req.body?.title === 'string' ? req.body.title.trim().slice(0, MAX_TITLE_LENGTH) : '';
    if (!title) return res.status(400).json({ error: 'A title is required' });
    const message = typeof req.body?.message === 'string' && req.body.message.trim() ? req.body.message.trim().slice(0, MAX_MESSAGE_LENGTH) : null;
    const ids: string[] = Array.isArray(req.body?.documentIds) ? [...new Set(req.body.documentIds.filter((x: unknown) => typeof x === 'string') as string[])] : [];
    if (!ids.length) return res.status(400).json({ error: 'Choose at least one document' });
    if (ids.length > MAX_DOCUMENTS_PER_PACKAGE) return res.status(400).json({ error: 'Too many documents in one package (at most 20)' });

    // Every document must be in this brokerage and visible to the person sharing it
    const docs = await prisma.document.findMany({ where: { id: { in: ids }, orgId: user.orgId } });
    if (docs.length !== ids.length) return res.status(400).json({ error: 'Document not found' });
    for (const d of docs) if (!(await canAccessDocument(user, d))) return res.status(400).json({ error: 'Document not found' });

    const propertyId = typeof req.body?.propertyId === 'string' && req.body.propertyId ? req.body.propertyId : null;
    const clientId = typeof req.body?.clientId === 'string' && req.body.clientId ? req.body.clientId : null;
    const refErr = await checkRefs(user.orgId, { propertyId, clientId }, user);
    if (refErr) return res.status(400).json({ error: refErr });

    const settings = linkSettings(req.body);
    if ('error' in settings) return res.status(400).json({ error: settings.error });

    const pkg = await prisma.sharePackage.create({
        data: {
            orgId: user.orgId, createdById: user.userId, title, message, propertyId, clientId,
            documents: { create: ids.map((documentId, position) => ({ documentId, position })) },
            links: { create: { ...settings, orgId: user.orgId, token: newShareToken() } },
        },
        include: { links: { select: LINK_SELECT } },
    });
    await audit(req, 'CREATE_SHARE_PACKAGE', 'SharePackage', pkg.id, undefined, { title, documentIds: ids, recipientEmail: settings.recipientEmail });
    res.status(201).json({ id: pkg.id, title: pkg.title, link: linkOut(pkg.links[0]) });
});

// GET /api/shares — packages with their links and view counts
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const packages = await prisma.sharePackage.findMany({
        where: packageScope(user),
        orderBy: { createdAt: 'desc' },
        take: 200,
        include: {
            documents: { orderBy: { position: 'asc' }, select: { document: { select: { id: true, name: true } } } },
            links: { orderBy: { createdAt: 'desc' }, select: { ...LINK_SELECT, views: { select: { lastSeenAt: true } } } },
        },
    });
    const creators = await prisma.user.findMany({ where: { id: { in: [...new Set(packages.map(p => p.createdById))] }, orgId: user.orgId }, select: { id: true, name: true } });
    const nameOf = new Map(creators.map(c => [c.id, c.name]));
    res.json(packages.map(p => ({
        id: p.id, title: p.title, message: p.message, propertyId: p.propertyId, clientId: p.clientId, createdAt: p.createdAt,
        createdBy: { id: p.createdById, name: nameOf.get(p.createdById) ?? null },
        documents: p.documents.map(d => d.document),
        links: p.links.map(linkOut),
    })));
});

async function findPackage(user: User, id: string) {
    return prisma.sharePackage.findFirst({ where: { id, ...packageScope(user) } });
}

// GET /api/shares/:id — one package with every view of every link
router.get('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const pkg = await prisma.sharePackage.findFirst({
        where: { id: String(req.params.id), ...packageScope(user) },
        include: {
            documents: { orderBy: { position: 'asc' }, select: { document: { select: { id: true, name: true, mimeType: true } } } },
            links: {
                orderBy: { createdAt: 'desc' },
                select: {
                    ...LINK_SELECT,
                    views: {
                        orderBy: { startedAt: 'desc' },
                        select: { id: true, viewerEmail: true, ndaAcceptedAt: true, startedAt: true, lastSeenAt: true, totalSeconds: true, pages: true },
                    },
                },
            },
        },
    });
    if (!pkg) return res.status(404).json({ error: 'Not found' });
    res.json({
        ...pkg,
        documents: pkg.documents.map(d => d.document),
        links: pkg.links.map(l => ({ ...linkOut(l), views: l.views })),
    });
});

// POST /api/shares/:id/links — another link to the same package (e.g. for a second recipient)
router.post('/:id/links', requireTier('ELITE'), async (req: AuthRequest, res) => {
    const user = req.user!;
    const pkg = await findPackage(user, String(req.params.id));
    if (!pkg) return res.status(404).json({ error: 'Not found' });
    const settings = linkSettings(req.body);
    if ('error' in settings) return res.status(400).json({ error: settings.error });
    const link = await prisma.shareLink.create({ data: { ...settings, packageId: pkg.id, orgId: user.orgId, token: newShareToken() }, select: LINK_SELECT });
    await audit(req, 'CREATE_SHARE_LINK', 'SharePackage', pkg.id, undefined, { linkId: link.id, recipientEmail: settings.recipientEmail });
    res.status(201).json(linkOut(link));
});

// PATCH /api/shares/links/:linkId { revoked?: boolean, expiresAt?: string | null }
router.patch('/links/:linkId', async (req: AuthRequest, res) => {
    const user = req.user!;
    const link = await prisma.shareLink.findFirst({ where: { id: String(req.params.linkId), orgId: user.orgId }, include: { package: true } });
    if (!link || (!seesAll(user) && link.package.createdById !== user.userId)) return res.status(404).json({ error: 'Not found' });
    const data: { revokedAt?: Date | null; expiresAt?: Date | null } = {};
    if (req.body?.revoked === true) data.revokedAt = new Date();
    if (req.body?.revoked === false) data.revokedAt = null;
    if (req.body?.expiresAt === null) data.expiresAt = null;
    else if (req.body?.expiresAt !== undefined) {
        const d = new Date(req.body.expiresAt);
        if (isNaN(d.getTime()) || d.getTime() <= Date.now()) return res.status(400).json({ error: 'The expiry must be in the future' });
        data.expiresAt = d;
    }
    if (!Object.keys(data).length) return res.status(400).json({ error: 'Nothing to change' });
    const updated = await prisma.shareLink.update({ where: { id: link.id }, data, select: LINK_SELECT });
    await audit(req, data.revokedAt ? 'REVOKE_SHARE_LINK' : 'UPDATE_SHARE_LINK', 'SharePackage', link.packageId, undefined, { linkId: link.id, ...data });
    res.json(linkOut(updated));
});

// DELETE /api/shares/:id — removes the package, its links and their view records
router.delete('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const pkg = await findPackage(user, String(req.params.id));
    if (!pkg) return res.status(404).json({ error: 'Not found' });
    await prisma.sharePackage.delete({ where: { id: pkg.id } });
    await audit(req, 'DELETE_SHARE_PACKAGE', 'SharePackage', pkg.id, { title: pkg.title }, undefined);
    res.json({ ok: true });
});

export default router;
