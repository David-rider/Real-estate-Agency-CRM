import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';
import { audit } from '../lib/audit';
import { verifyGoogle, verifyApple, sendSocialError, SocialAuthError, Provider } from '../lib/socialAuth';

// Linked sign-in providers for the signed-in user: /api/settings/social
const router = Router();
const FIELD = { google: 'googleId', apple: 'appleId' } as const;
const isProvider = (p: string): p is Provider => p === 'google' || p === 'apple';

// GET /api/settings/social — which providers are linked, and whether a password is set
router.get('/', async (req: AuthRequest, res) => {
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { googleId: true, appleId: true, password: true } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    res.json({
        google: !!u.googleId, apple: !!u.appleId, hasPassword: !!u.password,
        available: { google: !!process.env.GOOGLE_CLIENT_ID, apple: !!process.env.APPLE_CLIENT_ID },
    });
});

// POST /api/settings/social/:provider — link a provider account (body: Google idToken / Apple identityToken)
router.post('/:provider', async (req: AuthRequest, res) => {
    try {
        const provider = String(req.params.provider);
        if (!isProvider(provider)) return res.status(404).json({ error: 'Not found' });
        const id = provider === 'google' ? await verifyGoogle(req.body ?? {}) : await verifyApple(req.body ?? {});
        const field = FIELD[provider];
        const other = await prisma.user.findFirst({ where: { [field]: id.subject, NOT: { id: req.user!.userId } }, select: { id: true } });
        if (other) throw new SocialAuthError(409, 'This account is already linked to another user');
        await prisma.user.update({ where: { id: req.user!.userId }, data: { [field]: id.subject } });
        await audit(req, provider === 'google' ? 'LINK_GOOGLE' : 'LINK_APPLE', 'User', req.user!.userId, null, { email: id.email });
        res.json({ linked: true });
    } catch (err) {
        sendSocialError(res, err, 'Social link');
    }
});

// DELETE /api/settings/social/:provider — unlink (needs a password so the user can still sign in)
router.delete('/:provider', async (req: AuthRequest, res) => {
    const provider = String(req.params.provider);
    if (!isProvider(provider)) return res.status(404).json({ error: 'Not found' });
    const u = await prisma.user.findUnique({ where: { id: req.user!.userId }, select: { password: true, googleId: true, appleId: true } });
    if (!u) return res.status(404).json({ error: 'User not found' });
    const otherLinked = provider === 'google' ? !!u.appleId : !!u.googleId;
    if (!u.password && !otherLinked) return res.status(400).json({ error: 'Set a password before unlinking, so you can still sign in', code: 'NEEDS_PASSWORD' });
    await prisma.user.update({ where: { id: req.user!.userId }, data: { [FIELD[provider]]: null } });
    await audit(req, provider === 'google' ? 'UNLINK_GOOGLE' : 'UNLINK_APPLE', 'User', req.user!.userId);
    res.json({ linked: false });
});

export default router;
