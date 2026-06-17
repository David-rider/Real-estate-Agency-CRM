"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const router = express_1.default.Router();
// Get all media assets for an org (optionally filtered by propertyId)
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const propertyId = req.query.propertyId;
        const whereClause = { orgId };
        if (propertyId) {
            whereClause.propertyId = propertyId;
        }
        const media = await server_1.prisma.mediaAsset.findMany({
            where: whereClause
        });
        res.json(media);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new media asset
router.post('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const { url, type, propertyId } = req.body;
        const media = await server_1.prisma.mediaAsset.create({
            data: { url, type, propertyId, orgId }
        });
        res.status(201).json(media);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
