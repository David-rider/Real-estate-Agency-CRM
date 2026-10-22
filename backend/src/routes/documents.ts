import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { checkRefs, isManager } from '../lib/access';

const router = express.Router();
const DOC_TYPES = ['CONTRACT', 'INSPECTION', 'APPRAISAL', 'BOARD_PACKAGE', 'ID', 'DISCLOSURE', 'OTHER'];

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

// POST /api/documents — registers a document by URL
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const name = typeof req.body.name === 'string' ? req.body.name.trim() : '';
    const url = typeof req.body.url === 'string' ? req.body.url.trim() : '';
    if (!name) return res.status(400).json({ error: 'Document name is required' });
    if (!/^https?:\/\//i.test(url)) return res.status(400).json({ error: 'A valid http(s) link is required' });
    const type = DOC_TYPES.includes(req.body.type) ? req.body.type : 'OTHER';
    const transactionId = req.body.transactionId || null;
    const refErr = await checkRefs(user.orgId, { transactionId });
    if (refErr) return res.status(400).json({ error: refErr });

    const doc = await prisma.document.create({
        data: {
            name, url, type, transactionId,
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
    res.json({ message: 'Document deleted' });
});

export default router;
