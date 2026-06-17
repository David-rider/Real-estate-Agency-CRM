"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const sync_1 = require("csv-parse/sync");
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const crypto_1 = __importDefault(require("crypto"));
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const upload = (0, multer_1.default)({ storage: multer_1.default.memoryStorage() });
// GET /api/settings/users/export
router.get('/export', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // FIRMADMIN or SUPERADMIN can export
        if (!['FIRMADMIN', 'SUPERADMIN', 'MANAGER'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden' });
        }
        const users = await prisma.user.findMany({
            where: { orgId: req.user.orgId },
            select: { name: true, email: true, role: true, tier: true, createdAt: true }
        });
        const header = ["Name", "Email", "Role", "Tier", "Joined Date"].join(",");
        const rows = users.map(u => `"${u.name}","${u.email}","${u.role}","${u.tier}","${u.createdAt.toISOString()}"`).join("\n");
        const csvContent = `${header}\n${rows}`;
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=users_export.csv');
        res.status(200).send(csvContent);
    }
    catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export users' });
    }
});
// POST /api/settings/users/import
router.post('/import', upload.single('file'), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        if (!['FIRMADMIN', 'SUPERADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a CSV file' });
        }
        const csvString = req.file.buffer.toString('utf-8');
        const records = (0, sync_1.parse)(csvString, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        });
        let importedCount = 0;
        for (const record of records) {
            const email = record.Email || record.email;
            const name = record.Name || record.name;
            const role = record.Role || record.role || 'AGENT';
            const tier = record.Tier || record.tier || 'CORE';
            if (!email)
                continue;
            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (!existingUser) {
                // Hash a random secret so the account is locked until the user sets a
                // real password via a password-reset flow.
                const lockedPasswordHash = await bcryptjs_1.default.hash(crypto_1.default.randomBytes(32).toString('hex'), 10);
                await prisma.user.create({
                    data: {
                        email,
                        password: lockedPasswordHash,
                        name: name || email.split('@')[0],
                        role: ['AGENT', 'MANAGER', 'FIRMADMIN', 'SUPERADMIN'].includes(role.toUpperCase()) ? role.toUpperCase() : 'AGENT',
                        tier: ['CORE', 'PRO', 'ELITE'].includes(tier.toUpperCase()) ? tier.toUpperCase() : 'CORE',
                        orgId: req.user.orgId
                    }
                });
                importedCount++;
            }
        }
        res.status(200).json({ message: `Successfully imported ${importedCount} users` });
    }
    catch (error) {
        console.error('Import error:', error);
        res.status(500).json({ error: `Failed to import users: ${error.message}` });
    }
});
exports.default = router;
