import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { OAuth2Client } from 'google-auth-library';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

// Helper to generate token
const generateToken = (user: any) => {
    return jwt.sign(
        { userId: user.id, role: user.role, tier: user.tier, orgId: user.orgId },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// POST /api/oauth/google
router.post('/google', async (req, res) => {
    try {
        const { idToken } = req.body;

        if (!idToken) {
            return res.status(400).json({ error: 'Google ID token is required' });
        }

        // Verify the ID token with Google
        let email: string;
        let name: string;
        let googleId: string;
        if (process.env.GOOGLE_CLIENT_ID) {
            const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
            const ticket = await client.verifyIdToken({ idToken, audience: process.env.GOOGLE_CLIENT_ID });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) return res.status(401).json({ error: 'Invalid Google token' });
            email = payload.email;
            name = payload.name || payload.email.split('@')[0];
            googleId = payload.sub;
        } else {
            // Dev mode: accept mock token structure (not for production)
            console.warn('[OAuth] GOOGLE_CLIENT_ID not set — skipping token verification (dev mode)');
            const mock = req.body;
            if (!mock.email || !mock.googleId) return res.status(400).json({ error: 'Dev mode: email and googleId required' });
            email = mock.email;
            name = mock.name || mock.email.split('@')[0];
            googleId = mock.googleId;
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // First time login - auto create account and join default org
            let org = await prisma.organization.findFirst();
            if (!org) {
                org = await prisma.organization.create({
                    data: { name: 'Default Organization' }
                });
            }

            user = await prisma.user.create({
                data: {
                    name: name || email.split('@')[0],
                    email,
                    googleId,
                    role: 'AGENT',
                    tier: 'CORE',
                    orgId: org.id
                }
            });
        } else if (user.googleId && user.googleId === googleId) {
            // Existing account with matching googleId — allow login
        } else {
            // Account exists but googleId doesn't match or isn't linked.
            // Reject to prevent account takeover. Linking must be done
            // through authenticated account settings after password login.
            return res.status(409).json({ error: 'An account with this email already exists. Please log in with your password and link Google from account settings.' });
        }

        const token = generateToken(user);
        res.json({ message: 'Google login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId } });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/oauth/apple
// PRODUCTION TODO: verify req.body.identityToken using apple-signin-auth verifyIdToken()
// and extract email from the verified payload — never trust email from the request body.
router.post('/apple', async (req, res) => {
    try {
        const { email, name, appleId } = req.body;

        if (!email || !appleId) {
            return res.status(400).json({ error: 'Email and Apple ID are required' });
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            let org = await prisma.organization.findFirst();
            if (!org) {
                org = await prisma.organization.create({
                    data: { name: 'Default Organization' }
                });
            }

            user = await prisma.user.create({
                data: {
                    name: name || email.split('@')[0],
                    email,
                    appleId,
                    role: 'AGENT',
                    tier: 'CORE',
                    orgId: org.id
                }
            });
        } else if (user.appleId && user.appleId === appleId) {
            // Existing account with matching appleId — allow login
        } else {
            // Account exists but appleId doesn't match or isn't linked.
            // Reject to prevent account takeover.
            return res.status(409).json({ error: 'An account with this email already exists. Please log in with your password and link Apple from account settings.' });
        }

        const token = generateToken(user);
        res.json({ message: 'Apple login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId } });
    } catch (error) {
        console.error('Apple OAuth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
