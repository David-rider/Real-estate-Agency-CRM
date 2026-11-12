import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { audit } from '../lib/audit';
import {
    generateSecret, otpauthUrl, encryptSecret, decryptSecret, verifyTotp,
    generateRecoveryCodes, useRecoveryCode,
} from '../lib/totp';

// Two-factor authentication for the signed-in user: /api/settings/2fa
const router = Router();

const SELECT = { email: true, password: true, totpEnabled: true, totpSecret: true, totpRecoveryCodes: true, totpLastStep: true } as const;
const hashes = (v: unknown) => (Array.isArray(v) ? (v as string[]) : []);

// GET /api/settings/2fa — is it on, and how many recovery codes are left
router.get('/', async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: SELECT });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({ enabled: u.totpEnabled, recoveryCodesLeft: u.totpEnabled ? hashes(u.totpRecoveryCodes).length : 0 });
});

// POST /api/settings/2fa/setup — new secret for the authenticator app (not active until confirmed)
router.post('/setup', async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: SELECT });
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (u.totpEnabled) return res.status(409).json({ error: 'Two-factor authentication is already on' });
    const secret = generateSecret();
    await prisma.user.update({ where: { id: req.user!.userId }, data: { totpSecret: encryptSecret(secret) } });
    res.json({ secret, otpauthUrl: otpauthUrl(secret, u.email) });
});

// POST /api/settings/2fa/enable { code } — confirm the app works; returns the recovery codes once
router.post('/enable', async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: SELECT });
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (u.totpEnabled) return res.status(409).json({ error: 'Two-factor authentication is already on' });
    if (!u.totpSecret) return res.status(400).json({ error: 'Start the setup first' });
    const step = verifyTotp(decryptSecret(u.totpSecret), req.body?.code);
    if (step === null) return res.status(400).json({ error: 'That code is not correct. Check the time on your phone and try again.', code: 'INVALID_2FA_CODE' });
    const { codes, hashes: stored } = generateRecoveryCodes();
    await prisma.user.update({
        where: { id: req.user!.userId },
        data: { totpEnabled: true, totpRecoveryCodes: stored, totpLastStep: step },
    });
    await audit(req, 'ENABLE_2FA', 'User', req.user!.userId);
    res.json({ enabled: true, recoveryCodes: codes });
});

// POST /api/settings/2fa/disable { password, code } — needs the password and a current code (or a recovery code)
router.post('/disable', async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: SELECT });
    if (!u) return res.status(404).json({ error: 'User not found' });
    if (!u.totpEnabled || !u.totpSecret) return res.status(400).json({ error: 'Two-factor authentication is not on' });
    if (!u.password || !(await bcrypt.compare(String(req.body?.password ?? ''), u.password))) {
        return res.status(400).json({ error: 'The password is not correct', code: 'INVALID_PASSWORD' });
    }
    const code = String(req.body?.code ?? '');
    const ok = verifyTotp(decryptSecret(u.totpSecret), code) !== null || useRecoveryCode(hashes(u.totpRecoveryCodes), code) !== null;
    if (!ok) return res.status(400).json({ error: 'That code is not correct', code: 'INVALID_2FA_CODE' });
    await prisma.user.update({
        where: { id: req.user!.userId },
        data: { totpEnabled: false, totpSecret: null, totpRecoveryCodes: [], totpLastStep: null },
    });
    await audit(req, 'DISABLE_2FA', 'User', req.user!.userId);
    res.json({ enabled: false });
});


// POST /api/settings/2fa/users/:id/reset — an admin turns 2FA off for a colleague who lost their phone
router.post('/users/:id/reset', async (req: AuthRequest, res) => {
    if (!['SUPERADMIN', 'FIRMADMIN'].includes(req.user!.role)) return res.status(403).json({ error: 'Only an administrator can do this' });
    const target = await prisma.user.findFirst({ where: { id: String(req.params.id), orgId: req.user!.orgId }, select: { id: true } });
    if (!target) return res.status(404).json({ error: 'User not found' });
    await prisma.user.update({
        where: { id: target.id },
        data: { totpEnabled: false, totpSecret: null, totpRecoveryCodes: [], totpLastStep: null },
    });
    await audit(req, 'RESET_2FA', 'User', target.id);
    res.json({ enabled: false });
});

export default router;
