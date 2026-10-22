import express from 'express';
import multer from 'multer';
import { parse } from 'csv-parse/sync';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { getSeatUsage } from '../lib/seats';
import { audit } from '../lib/audit';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 2 * 1024 * 1024 } });

// Members inherit the organization's plan
const ORG_SUB_TO_TIER: Record<string, 'CORE' | 'PRO' | 'ELITE'> = { BASIC: 'CORE', PRO: 'PRO', ENTERPRISE: 'ELITE' };

// Neutralise spreadsheet formula injection (=, +, -, @ at the start of a cell)
function csvCell(v: unknown) {
    let s = String(v ?? '');
    if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
    return `"${s.replace(/"/g, '""')}"`;
}

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
        const rows = users.map(u => [u.name, u.email, u.role, u.tier, u.createdAt.toISOString()].map(csvCell).join(',')).join("\n");
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
        const skipped: string[] = [];
        const seats = await getSeatUsage(req.user.orgId);
        let used = seats.users + seats.pendingInvites;
        const tier = ORG_SUB_TO_TIER[seats.subscription] || 'CORE';
        // Bulk import can create staff roles, never platform or firm admins
        const IMPORTABLE_ROLES = ['AGENT', 'MANAGER', 'OFFICE_SUPPORT', 'MARKETING'];

        for (const record of records) {
            const email = String(record.Email || record.email || '').trim().toLowerCase();
            const name = String(record.Name || record.name || '').trim();
            const role = String(record.Role || record.role || 'AGENT').trim().toUpperCase();

            if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { if (email) skipped.push(`${email} (invalid email)`); continue; }
            if (seats.limit !== null && used >= seats.limit) { skipped.push(`${email} (seat limit reached)`); continue; }

            const existingUser = await prisma.user.findUnique({ where: { email } });
            if (existingUser) { skipped.push(`${email} (already exists)`); continue; }
            {
                // Hash a random secret so the account is locked until the user sets a
                // real password via a password-reset flow.
                const lockedPasswordHash = await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10);
                await prisma.user.create({
                    data: {
                        email,
                        password: lockedPasswordHash,
                        name: name || email.split('@')[0],
                        role: (IMPORTABLE_ROLES.includes(role) ? role : 'AGENT') as any,
                        tier,
                        orgId: req.user.orgId
                    }
                });
                importedCount++;
                used++;
            }
        }

        await audit(req, 'IMPORT_USERS', 'User', null, undefined, { importedCount, skipped: skipped.length });
        res.status(200).json({ message: `Imported ${importedCount} users`, importedCount, skipped });
    } catch (error: any) {
        console.error('Import error:', error);
        res.status(400).json({ error: 'Could not read the CSV file. Expected columns: Name, Email, Role' });
    }
});

export default router;
