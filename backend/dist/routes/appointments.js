"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const server_1 = require("../server");
const notifications_1 = require("./notifications");
const router = express_1.default.Router();
// GET /api/appointments
router.get('/', async (req, res) => {
    try {
        const orgId = req.user?.orgId;
        const userId = req.user?.userId;
        if (!orgId || !userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const appointments = await server_1.prisma.appointment.findMany({
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
        const newAppointment = await server_1.prisma.appointment.create({
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
        // Notify the agent about the new appointment
        const apptDate = new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
        await (0, notifications_1.createNotification)(agentId, orgId, 'APPOINTMENT', 'Appointment Scheduled', `"${title}" has been scheduled for ${apptDate}.`, '/appointments');
        res.status(201).json(newAppointment);
    }
    catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ error: 'Failed to create appointment' });
    }
});
exports.default = router;
