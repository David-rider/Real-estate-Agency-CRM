import express from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { checkRefs, isManager } from '../lib/access';

const router = express.Router();
const TYPES = ['image', 'video', 'floorplan', '3d_tour'];

// GET /api/media?propertyId=
router.get('/', async (req: AuthRequest, res) => {
    const where: any = { orgId: req.user!.orgId };
    if (typeof req.query.propertyId === 'string') where.propertyId = req.query.propertyId;
    const media = await prisma.mediaAsset.findMany({ where, orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] });
    res.json(media);
});

// POST /api/media — attach a photo/video link to a listing
router.post('/', async (req: AuthRequest, res) => {
    const user = req.user!;
    const { url, propertyId, caption } = req.body;
    if (typeof url !== 'string' || !/^https?:\/\//i.test(url.trim())) {
        return res.status(400).json({ error: 'A valid http(s) link is required' });
    }
    if (!propertyId) return res.status(400).json({ error: 'Property is required' });
    const property = await prisma.property.findFirst({ where: { id: propertyId, orgId: user.orgId } });
    if (!property) return res.status(400).json({ error: 'Property not found' });
    if (property.agentId !== user.userId && !isManager(user)) return res.status(403).json({ error: 'Forbidden' });
    const count = await prisma.mediaAsset.count({ where: { propertyId } });
    const media = await prisma.mediaAsset.create({
        data: {
            url: url.trim(),
            type: TYPES.includes(req.body.type) ? req.body.type : 'image',
            caption: typeof caption === 'string' ? caption : null,
            sortOrder: count,
            propertyId, orgId: user.orgId,
        },
    });
    res.status(201).json(media);
});

// DELETE /api/media/:id
router.delete('/:id', async (req: AuthRequest, res) => {
    const user = req.user!;
    const media = await prisma.mediaAsset.findFirst({ where: { id: String(req.params.id), orgId: user.orgId }, include: { property: true } });
    if (!media) return res.status(404).json({ error: 'Media not found' });
    if (media.property.agentId !== user.userId && !isManager(user)) return res.status(403).json({ error: 'Forbidden' });
    await prisma.mediaAsset.delete({ where: { id: media.id } });
    res.json({ message: 'Media deleted' });
});

export default router;
