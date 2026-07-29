"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const client_1 = require("@prisma/client");
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const email_1 = require("../lib/email");
const authMiddleware_1 = require("../middleware/authMiddleware");
const seats_1 = require("../lib/seats");
// Org subscription level → member tier (subscription is org-wide)
const ORG_SUB_TO_TIER = {
    BASIC: 'CORE',
    PRO: 'PRO',
    ENTERPRISE: 'ELITE',
};
// Email verification is only enforceable when a real email service can deliver
// the verification link — otherwise new users could never verify and would be locked out
const emailServiceConfigured = () => !!(process.env.EMAIL_API_KEY && process.env.EMAIL_FROM);
const authLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per 15 minutes
    message: { error: 'Too many authentication attempts from this IP, please try again after 15 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET;
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
        const isMatch = await bcryptjs_1.default.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }
        if (!user.isActive) {
            return res.status(403).json({ error: 'This account has been deactivated. Contact your administrator.' });
        }
        if (!user.emailVerified && emailServiceConfigured()) {
            return res.status(403).json({
                error: 'Please verify your email address before logging in. Check your inbox, or request a new link.',
                code: 'EMAIL_NOT_VERIFIED',
            });
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, tier: user.tier, orgId: user.orgId }, JWT_SECRET, { expiresIn: '24h' });
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
    }
    catch (error) {
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
        if (!orgName || !orgName.trim()) {
            return res.status(400).json({ error: 'Organization / firm name is required' });
        }
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'Email already in use' });
        }
        // /register always CREATES a new organization — the registrant becomes its FIRMADMIN.
        // Joining an EXISTING org is done exclusively through the invite-token flow
        // (/accept-invite), which verifies a server-issued token rather than a
        // user-typed name. Organization names are not unique identifiers — two real
        // brokerages can legitimately share a name (e.g. "Sunrise Realty" in different
        // cities) — so name-matching was never a valid way to detect "does this org exist".
        const org = await prisma.organization.create({
            data: { name: orgName.trim() }
        });
        const newRole = 'FIRMADMIN'; // Creator of a new org becomes its admin
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const verifyToken = crypto_1.default.randomBytes(32).toString('hex');
        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: newRole,
                tier: 'CORE',
                orgId: org.id,
                // No email service → nothing to click, auto-verify so login isn't blocked
                emailVerified: !emailServiceConfigured(),
            }
        });
        // Send verification email (non-blocking — fails gracefully if SMTP not configured)
        try {
            await prisma.$executeRaw `UPDATE "User" SET "emailVerifyToken" = ${verifyToken} WHERE id = ${newUser.id}`;
            const appUrl = process.env.APP_URL || 'http://localhost:3000';
            const verifyUrl = `${appUrl}/verify-email?token=${verifyToken}`;
            (0, email_1.sendEmail)({ to: newUser.email, subject: 'Verify your email', html: (0, email_1.welcomeEmail)(verifyUrl, newUser.name) }).catch(console.error);
        }
        catch (emailErr) {
            console.error('Verification email / token setup failed (non-blocking):', emailErr);
        }
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, role: newUser.role, tier: newUser.tier, orgId: newUser.orgId }, JWT_SECRET, { expiresIn: '24h' });
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
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/forgot-password
router.post('/forgot-password', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        const user = await prisma.user.findUnique({ where: { email } });
        // Always respond 200 to prevent email enumeration
        if (!user)
            return res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
        const token = crypto_1.default.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        await prisma.user.update({
            where: { email },
            data: { passwordResetToken: token, passwordResetExpiry: expiresAt }
        });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        const resetUrl = `${appUrl}/reset-password?token=${token}`;
        await (0, email_1.sendEmail)({
            to: email,
            subject: 'Reset your password',
            html: (0, email_1.passwordResetEmail)(resetUrl, user.name),
            text: `Reset your password: ${resetUrl}`
        });
        res.status(200).json({ message: 'If that email exists, a reset link has been sent.' });
    }
    catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/reset-password
router.post('/reset-password', authLimiter, async (req, res) => {
    try {
        const { token, password } = req.body;
        if (!token || !password)
            return res.status(400).json({ error: 'Token and password are required' });
        if (password.length < 8)
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: { gt: new Date() }
            }
        });
        if (!user)
            return res.status(400).json({ error: 'Invalid or expired reset token' });
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        await prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, passwordResetToken: null, passwordResetExpiry: null }
        });
        res.json({ message: 'Password reset successfully. You can now log in.' });
    }
    catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/accept-invite
// Allows an invited user to create their account and join an existing org.
// SECURITY: org membership and role come from the server-side Invitation record,
// looked up by the single-use token — never from the request body.
router.post('/accept-invite', authLimiter, async (req, res) => {
    try {
        const { name, email, password, inviteToken } = req.body;
        if (!name || !email || !password || !inviteToken) {
            return res.status(400).json({ error: 'Name, email, password, and invite token are required' });
        }
        if (password.length < 8) {
            return res.status(400).json({ error: 'Password must be at least 8 characters' });
        }
        // Look up the invitation by its token
        const invitation = await prisma.invitation.findUnique({ where: { token: inviteToken } });
        if (!invitation) {
            return res.status(403).json({ error: 'Invalid invite link. Please ask your admin to send a new invitation.' });
        }
        if (invitation.acceptedAt) {
            return res.status(403).json({ error: 'This invitation has already been used.' });
        }
        if (invitation.expiresAt < new Date()) {
            return res.status(403).json({ error: 'This invitation has expired. Please ask your admin to send a new one.' });
        }
        if (invitation.email !== email.trim().toLowerCase()) {
            return res.status(403).json({ error: 'This invitation was sent to a different email address.' });
        }
        // Check email not already taken
        const existingUser = await prisma.user.findUnique({ where: { email: invitation.email } });
        if (existingUser) {
            return res.status(400).json({ error: 'An account with this email already exists. Please log in.' });
        }
        // Seat re-check at accept time (invite reserved the seat, so count active users only —
        // guards against the plan having been downgraded since the invite was sent)
        const seats = await (0, seats_1.getSeatUsage)(invitation.orgId);
        if (seats.limit !== null && seats.users >= seats.limit) {
            return res.status(403).json({ error: 'This team has reached its plan seat limit. Ask your admin to upgrade the plan.' });
        }
        const hashedPassword = await bcryptjs_1.default.hash(password, 10);
        const newUser = await prisma.user.create({
            data: {
                name,
                email: invitation.email,
                password: hashedPassword,
                role: invitation.role,
                tier: ORG_SUB_TO_TIER[seats.subscription] || 'CORE', // members inherit the org-wide plan
                orgId: invitation.orgId,
                emailVerified: true, // arriving via emailed link proves mailbox ownership
            },
        });
        // Mark invitation as consumed (single-use)
        await prisma.invitation.update({
            where: { id: invitation.id },
            data: { acceptedAt: new Date() },
        });
        // Generate JWT
        const token = jsonwebtoken_1.default.sign({ userId: newUser.id, role: newUser.role, tier: newUser.tier, orgId: newUser.orgId }, JWT_SECRET, { expiresIn: '24h' });
        res.status(201).json({
            message: 'Account created successfully. Welcome to the team!',
            token,
            user: {
                id: newUser.id,
                name: newUser.name,
                email: newUser.email,
                role: newUser.role,
                tier: newUser.tier,
                orgId: newUser.orgId,
            },
        });
    }
    catch (error) {
        console.error('Accept invite error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/resend-verification
router.post('/resend-verification', authLimiter, async (req, res) => {
    try {
        const { email } = req.body;
        if (!email)
            return res.status(400).json({ error: 'Email is required' });
        // Always respond 200 to prevent email enumeration
        const okMsg = { message: 'If that email exists and is unverified, a new link has been sent.' };
        const user = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (!user || user.emailVerified)
            return res.status(200).json(okMsg);
        const verifyToken = crypto_1.default.randomBytes(32).toString('hex');
        await prisma.user.update({ where: { id: user.id }, data: { emailVerifyToken: verifyToken } });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        await (0, email_1.sendEmail)({
            to: user.email,
            subject: 'Verify your email',
            html: (0, email_1.welcomeEmail)(`${appUrl}/verify-email?token=${verifyToken}`, user.name),
        });
        res.status(200).json(okMsg);
    }
    catch (error) {
        console.error('Resend verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/refresh
// Re-issues a JWT with the user's CURRENT role/tier from the database.
// Needed after a subscription upgrade — the old token still carries the stale tier.
router.post('/refresh', authMiddleware_1.authenticateToken, async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const user = await prisma.user.findUnique({ where: { id: req.user.userId } });
        if (!user)
            return res.status(404).json({ error: 'User not found' });
        if (!user.isActive)
            return res.status(403).json({ error: 'This account has been deactivated.' });
        const token = jsonwebtoken_1.default.sign({ userId: user.id, role: user.role, tier: user.tier, orgId: user.orgId }, JWT_SECRET, { expiresIn: '24h' });
        res.json({
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                tier: user.tier,
                orgId: user.orgId,
            },
        });
    }
    catch (error) {
        console.error('Token refresh error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
// POST /api/auth/verify-email
router.post('/verify-email', async (req, res) => {
    try {
        const { token } = req.body;
        if (!token)
            return res.status(400).json({ error: 'Token is required' });
        const user = await prisma.user.findFirst({
            where: { emailVerifyToken: token }
        });
        if (!user)
            return res.status(400).json({ error: 'Invalid verification token' });
        await prisma.user.update({
            where: { id: user.id },
            data: { emailVerified: true, emailVerifyToken: null }
        });
        res.json({ message: 'Email verified successfully. You can now log in.' });
    }
    catch (error) {
        console.error('Verify email error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
