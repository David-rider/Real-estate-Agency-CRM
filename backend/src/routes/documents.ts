import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { checkRefs, isManager } from '../lib/access';
import { createSignedPrivateFileToken, deleteUploadedFile } from '../lib/storage';

const router = express.Router();
const DOC_TYPES = ['CONTRACT', 'INSPECTION', 'APPRAISAL', 'BOARD_PACKAGE', 'ID', 'DISCLOSURE', 'OTHER'];

function getRequestBaseUrl(req: express.Request): string {
    const protoHeader = req.headers['x-forwarded-proto'];
    const proto = typeof protoHeader === 'string' ? protoHeader.split(',')[0].trim() : req.protocol;
    const host = req.get('host') || 'localhost:4000';
    return `${proto}://${host}`;
}

async function canAccessDocument(user: NonNullable<AuthRequest['user']>, doc: { uploadedById: string | null; transactionId: string | null; orgId: string }): Promise<boolean> {
    if (doc.orgId !== user.orgId) return false;
    if (isManager(user) || user.role === 'OFFICE_SUPPORT') return true;
    if (doc.uploadedById === user.userId) return true;
    if (doc.transactionId) {
        const tx = await prisma.transaction.findFirst({
            where: {
                id: doc.transactionId,
                orgId: user.orgId,
                OR: [{ agentId: user.userId }, { coAgentId: user.userId }],
            },
            select: { id: true },
        });
        if (tx) return true;
    }
    return false;
}

// GET /api/documents?transactionId=
router.get('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const where: any = { orgId: user.orgId };
    if (typeof req.query.transactionId === 'string') where.transactionId = req.query.transactionId;
    // Agents see documents on their deals plus anything they uploaded themselves
    if (!isManager(user) && user.role !== 'OFFICE_SUPPORT') {
        where.OR = [
            { uploadedById: user.userId },
            { transaction: { OR: [{ agentId: user.userId }, { coAgentId: user.userId }] } },
        ];
    }
    const documents = await prisma.document.findMany({
        where,
        include: { transaction: { select: { id: true, status: true, property: { select: { address: true } } } } },
        orderBy: { createdAt: 'desc' },
        take: 500,
    });
    res.json(documents);
});

// GET /api/documents/:id/view-url — returns a 10-minute signed URL for private documents
router.get('/:id/view-url', async (req: AuthRequest, res) => {
    const user = req.user!;
    const doc = await prisma.document.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (!(await canAccessDocument(user, doc))) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    if (doc.storageKey) {
        const { exp, sig } = createSignedPrivateFileToken(doc.storageKey, user.orgId, 600);
        const baseUrl = getRequestBaseUrl(req);
        const signedUrl = `${baseUrl}/api/uploads/private/${doc.storageKey}?exp=${exp}&sig=${sig}`;
        return res.json({ url: signedUrl, downloadUrl: `${signedUrl}&download=1`, expiresAt: new Date(exp * 1000).toISOString() });
    }

    return res.json({ url: doc.url, downloadUrl: doc.url, expiresAt: null });
});

// POST /api/documents — registers an uploaded document or external link
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const url = typeof req.body.url === 'string' ? req.body.url.trim() : '';
    const storageKey = typeof req.body.storageKey === 'string' && req.body.storageKey.trim() ? req.body.storageKey.trim() : null;
    const sizeBytes = typeof req.body.sizeBytes === 'number' && Number.isFinite(req.body.sizeBytes) ? Math.round(req.body.sizeBytes) : null;
    const mimeType = typeof req.body.mimeType === 'string' && req.body.mimeType.trim() ? req.body.mimeType.trim() : null;

    if (!name) return res.status(400).json({ error: 'Document name is required' });
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'A valid http(s) link is required' });
    const type = DOC_TYPES.includes(req.body.type) ? req.body.type : 'OTHER';
    const transactionId = req.body.transactionId || null;
    const refErr = await checkRefs(user.orgId, { transactionId });
    if (refErr) return res.status(400).json({ error: refErr });

    const doc = await prisma.document.create({
        data: {
            name,
            url,
            type,
            transactionId,
            storageKey,
            sizeBytes,
            mimeType,
            signatureRequired: req.body.signatureRequired === true,
            uploadedById: user.userId,
            orgId: user.orgId,
        },
    });
    res.status(201).json(doc);
});

// PATCH /api/documents/:id — rename / retype / mark signed
router.patch('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const doc = await prisma.document.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.uploadedById !== user.userId && !isManager(user)) return res.status(403).json({ error: 'Forbidden' });
    const data: any = {};
    if (typeof req.body.name === 'string' && req.body.name.trim()) data.name = req.body.name.trim();
    if (DOC_TYPES.includes(req.body.type)) data.type = req.body.type;
    if (req.body.signed === true) data.signedAt = new Date();
    if (req.body.signed === false) data.signedAt = null;
    res.json(await prisma.document.update({ where: { id: doc.id }, data }));
});

// DELETE /api/documents/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const doc = await prisma.document.findFirst({ where: { id: String(req.params.id), orgId: user.orgId } });
    if (!doc) return res.status(404).json({ error: 'Document not found' });
    if (doc.uploadedById !== user.userId && !isManager(user)) return res.status(403).json({ error: 'Forbidden' });
    await prisma.document.delete({ where: { id: doc.id } });
    if (doc.storageKey) {
        await deleteUploadedFile(doc.storageKey, user.orgId);
    }
    res.json({ message: 'Document deleted' });
});

export default router;
