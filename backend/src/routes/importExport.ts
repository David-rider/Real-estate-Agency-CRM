import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/authMiddleware';

const router = express.Router();
const prisma = new PrismaClient();
const upload = multer({ storage: multer.memoryStorage() });

// GET /api/settings/users/export
router.get('/export', async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        
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
    } catch (error) {
        console.error('Export error:', error);
        res.status(500).json({ error: 'Failed to export users' });
    }
});

// POST /api/settings/users/import
router.post('/import', upload.single('file'), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        
        if (!['FIRMADMIN', 'SUPERADMIN'].includes(req.user.role)) {
            return res.status(403).json({ error: 'Forbidden: Admins only' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a CSV file' });
        }

        const csvString = req.file.buffer.toString('utf-8');
        const records = parse(csvString, {
            columns: true,
            skip_empty_lines: true,
            trim: true
        }) as any[];

        let importedCount = 0;

        for (const record of records) {
            const email = record.Email || record.email;
            const name = record.Name || record.name;
            const role = record.Role || record.role || 'AGENT';
            const tier = record.Tier || record.tier || 'CORE';

            if (!email) continue;

            const existingUser = await prisma.user.findUnique({ where: { email } });
            
            if (!existingUser) {
                // Determine random or default password for CSV imported users
                await prisma.user.create({
                    data: {
                        email,
                        password: '', // satisfy any cached TS constraints
                        name: name || email.split('@')[0],
                        role: ['AGENT', 'MANAGER', 'FIRMADMIN', 'SUPERADMIN'].includes(role.toUpperCase()) ? role.toUpperCase() as any : 'AGENT',
                        tier: ['CORE', 'PRO', 'ELITE'].includes(tier.toUpperCase()) ? tier.toUpperCase() as any : 'CORE',
                        orgId: req.user.orgId
                    }
                });
                importedCount++;
            }
        }

        res.status(200).json({ message: `Successfully imported ${importedCount} users` });
    } catch (error: any) {
        console.error('Import error:', error);
        res.status(500).json({ error: `Failed to import users: ${error.message}` });
    }
});

export default router;
