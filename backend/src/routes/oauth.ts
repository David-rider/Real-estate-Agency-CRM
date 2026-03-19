import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-123';

// Helper to generate token
const generateToken = (user: any) => {
    return jwt.sign(
        { userId: user.id, role: user.role, tier: user.tier, orgId: user.orgId },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
};

// POST /api/oauth/google
// This endpoint expects a verified token or minimal profile data from frontend Google SDK
router.post('/google', async (req, res) => {
    try {
        const { email, name, googleId } = req.body;

        if (!email || !googleId) {
            return res.status(400).json({ error: 'Email and Google ID are required' });
        }

        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            // First time login - auto create account and join default org
            // In a real app, you might want them to choose an org or specify if they are creating one
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
        } else if (!user.googleId) {
            // Link existing account to Google
            user = await prisma.user.update({
                where: { email },
                data: { googleId }
            });
        }

        const token = generateToken(user);
        res.json({ message: 'Google login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId } });
    } catch (error) {
        console.error('Google OAuth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/oauth/apple
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
        } else if (!user.appleId) {
            user = await prisma.user.update({
                where: { email },
                data: { appleId }
            });
        }

        const token = generateToken(user);
        res.json({ message: 'Apple login successful', token, user: { id: user.id, name: user.name, email: user.email, role: user.role, orgId: user.orgId } });
    } catch (error) {
        console.error('Apple OAuth error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
