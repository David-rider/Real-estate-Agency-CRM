"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/appointments
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.userId;
        if (!orgId || !userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const appointments = await prisma.appointment.findMany({
            where: { orgId, agentId: userId },
            include: { client: true, property: true },
            orderBy: { date: 'asc' }
        });
        res.json(appointments);
    }
    catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ error: 'Failed to fetch appointments' });
    }
});
// POST /api/appointments
router.post('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const agentId = req.user?.userId;
        if (!orgId || !agentId)
            return res.status(401).json({ error: 'Unauthorized' });
        const { title, date, notes, status, clientId, propertyId } = req.body;
        const newAppointment = await prisma.appointment.create({
            data: {
                title,
                date: new Date(date),
                notes,
                status: status || 'SCHEDULED',
                clientId,
                propertyId,
                agentId,
                orgId
            }
        });
        res.status(201).json(newAppointment);
    }
    catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});
exports.default = router;
