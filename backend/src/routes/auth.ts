import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import rateLimit from 'express-rate-limit';
import { sendEmail, passwordResetEmail, welcomeEmail } from '../lib/email';

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

const router = express.Router();
const prisma = new PrismaClient();

const JWT_SECRET = process.env.JWT_SECRET as string;
if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    process.exit(1);
}

// POST /api/auth/login
router.post('/login', authLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ error: 'Email and password are required' });
        }

        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        if (!user.password) {
            return res.status(401).json({ error: 'Please login using your linked social account' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role, tier: user.tier, orgId: user.orgId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tier: user.tier,
                orgId: user.orgId
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/register
router.post('/register', authLimiter, async (req, res) => {
    try {
        const { name, email, password, orgName } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ error: 'Name, email, and password are required' });
        }

        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }

        let org = await prisma.organization.findFirst({
            where: { name: orgName }
        });

        let newRole = 'AGENT';

        if (!org) {
            org = await prisma.organization.create({
                data: {
                    name: orgName || 'Default Organization'
                }
            });
            newRole = 'FIRMADMIN'; // Creator of org becomes admin
        } else {
            // For now, restrict joining existing orgs by randomly typing the name
            return res.status(403).json({ error: 'Organization exists. Please request an invite to join.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: newRole as any,
                tier: 'CORE',
                orgId: org.id
            }
        });

        // Send verification email
        const verifyToken = crypto.randomBytes(32).toString('hex');
        await prisma.user.update({ where: { id: newUser.id }, data: { emailVerifyToken: verifyToken } });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
        sendEmail({ to: newUser.email, subject: 'Verify your email', html: welcomeEmail(verifyUrl, newUser.name) }).catch(console.error);

        // Generate JWT
        const token = jwt.sign(
            { userId: newUser.id, role: newUser.role, tier: newUser.tier, orgId: newUser.orgId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Registration successful',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                tier: newUser.tier,
                orgId: newUser.orgId
            }
        });
    } catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) return res.status(400).json({ error: 'Email is required' });

        const user = await prisma.user.findUnique({ where: { email } });

        // Always respond 200 to prevent email enumeration
        if (!user) return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

        await prisma.user.update({
            where: { email },
            data: { passwordResetToken: token, passwordResetExpiry: expiresAt }
        });

        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl}/reset-password?token=${token}`;

        await sendEmail({
            to: email,
            subject: 'Reset your password',
            html: passwordResetEmail(resetUrl, user.name),
            text: `Reset your password: ${resetUrl}`
        });

        res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password) return res.status(400).json({ error: 'Token and password are required' });
        if (password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });

        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gt: new Date() }
            }
        });

        if (!user) return res.status(400).json({ error: 'Invalid or expired reset token' });

        const hashedPassword = await bcrypt.hash(password, 10);

        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, passwordResetToken: null, passwordResetExpiry: null }
        });

        res.json({ message: 'Password reset successfully. You can now log in.' });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token) return res.status(400).json({ error: 'Token is required' });

        const user = await prisma.user.findFirst({
            where: { emailVerifyToken: token }
        });

        if (!user) return res.status(400).json({ error: 'Invalid verification token' });

        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, emailVerifyToken: null }
        });

        res.json({ message: 'Email verified successfully. You can now log in.' });
    } catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default router;
