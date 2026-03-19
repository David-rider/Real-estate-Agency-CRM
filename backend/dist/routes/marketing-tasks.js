"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Get all marketing tasks for an org
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const tasks = await prisma.marketingTask.findMany({
            where: { orgId }
        });
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
// Create a new marketing task
router.post('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const agentId = req.user?.id;
        const { title, content, status } = req.body;
        const task = await prisma.marketingTask.create({
            data: { title, content, status: status || 'PENDING', agentId, orgId }
        });
        res.status(201).json(task);
    }
    catch (error) {
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
