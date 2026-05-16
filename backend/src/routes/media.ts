import express from 'express';
import { prisma } from '../server';

const router = express.Router();

// Get all media assets for an org (optionally filtered by propertyId)
router.get('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const propertyId = req.query.propertyId as string | undefined;

        const whereClause: any = { orgId };
        if (propertyId) {
            whereClause.propertyId = propertyId;
        }

        const media = await prisma.mediaAsset.findMany({
            where: whereClause
        });
        res.json(media);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Create a new media asset
router.post('/', async (req, res) => {
    try {
        const orgId = (req as any).user?.orgId;
        const { url, type, propertyId } = req.body;
        const media = await prisma.mediaAsset.create({
            data: { url, type, propertyId, orgId }
        });
        res.status(201).json(media);
    } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
