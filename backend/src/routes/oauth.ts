import express from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { verifyGoogle, verifyApple, signInWithIdentity, sendSocialError } from '../lib/socialAuth';

const router = express.Router();
const prisma = new PrismaClient();

// OAuth endpoints are authentication endpoints and must be throttled like the
// password routes in auth.ts — without this they are an unmetered path for
// token-guessing and account-probing.
const oauthLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20,
    message: { error: 'Too many sign-in attempts from this IP, please try again later' },
    standardHeaders: true,
    legacyHeaders: false,
});
router.use(oauthLimiter);

// POST /api/oauth/google { idToken } — sign in or sign up with Google
router.post('/google', async (req, res) => {
    try {
        await signInWithIdentity(prisma, req, res, await verifyGoogle(req.body ?? {}));
    } catch (err) {
        sendSocialError(res, err, 'Google OAuth');
    }
});

// POST /api/oauth/apple { identityToken, user? } — sign in with Apple (503 until APPLE_CLIENT_ID is configured)
router.post('/apple', async (req, res) => {
    try {
        await signInWithIdentity(prisma, req, res, await verifyApple(req.body ?? {}));
    } catch (err) {
        sendSocialError(res, err, 'Apple OAuth');
    }
});

export default router;
