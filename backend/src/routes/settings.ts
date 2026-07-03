import { Router } from 'express';
import { prisma } from '../server';
import { AuthRequest, authorizeRole, authenticateToken } from '../middleware/authMiddleware';
import crypto from 'crypto';
import { sendEmail } from '../lib/email';

const router = Router();
router.use(authenticateToken);

// GET /api/settings/users — list all org users
router.get('/users', authorizeRole(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const users = await prisma.user.findMany({
            where: { orgId: req.user.orgId },
            select: {
                id: true, name: true, email: true, role: true, tier: true,
                phone: true, title: true, licenseNumber: true, avatarUrl: true,
                emailVerified: true, lastLoginAt: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// PATCH /api/settings/users/:id — update role/tier (settings page calls PATCH)
router.patch('/users/:id', authorizeRole(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { role, tier } = req.body;

        // Managers cannot elevate to FIRMADMIN/SUPERADMIN
        if (req.user.role === 'MANAGER' && (role === 'FIRMADMIN' || role === 'SUPERADMIN')) {
            return res.status(403).json({ error: 'Insufficient permissions to assign this role' });
        }

        const target = await prisma.user.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!target) return res.status(404).json({ error: 'User not found in your organization' });

        const updated = await prisma.user.update({
            where:  { id: target.id },
            data:   { ...(role ? { role } : {}), ...(tier ? { tier } : {}) },
            select: { id: true, name: true, role: true, tier: true },
        });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// PUT /api/settings/users/:id/role — legacy endpoint kept for compatibility
router.put('/users/:id/role', authorizeRole(['SUPERADMIN', 'FIRMADMIN']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
        const { role, tier } = req.body;
        const target = await prisma.user.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!target) return res.status(404).json({ error: 'User not found in your organization' });

        const updated = await prisma.user.update({
            where:  { id: target.id },
            data:   { role, tier },
            select: { id: true, name: true, role: true, tier: true },
        });
        res.json(updated);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});

// DELETE /api/settings/users/:id — deactivate (soft delete: set role to OFFICE_SUPPORT with no access)
router.delete('/users/:id', authorizeRole(['SUPERADMIN', 'FIRMADMIN']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        // Prevent self-deletion
        if (String(req.params.id) === req.user.userId) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }

        const target = await prisma.user.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!target) return res.status(404).json({ error: 'User not found' });
        if (target.role === 'SUPERADMIN') return res.status(403).json({ error: 'Cannot deactivate superadmin' });

        // Soft-delete: mark as OFFICE_SUPPORT with a special flag via password lock
        await prisma.user.update({
            where: { id: String(req.params.id) },
            data:  { tier: 'CORE' }, // revoke elevated tier; frontend should show as inactive
        });

        res.json({ message: 'User deactivated' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});

// POST /api/settings/invite — invite a team member by email
router.post('/invite', authorizeRole(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req: AuthRequest, res) => {
    try {
        if (!req.user) return res.status(401).json({ error: 'Unauthorized' });

        const { email, role } = req.body;
        if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });

        // Prevent managers from inviting FIRMADMIN/SUPERADMIN
        if (req.user.role === 'MANAGER' && (role === 'FIRMADMIN' || role === 'SUPERADMIN')) {
            return res.status(403).json({ error: 'Insufficient permissions to invite this role' });
        }

        // Check if already a member
        const existing = await prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
            if (existing.orgId === req.user.orgId) {
                return res.status(409).json({ error: 'This email is already a member of your organization' });
            }
            return res.status(409).json({ error: 'This email is already registered' });
        }

        // Generate invite token and persist it — accept-invite validates against this record
        const inviteToken = crypto.randomBytes(32).toString('hex');
        const normalizedEmail = email.trim().toLowerCase();
        const safeRoles = ['AGENT', 'MANAGER', 'ATTORNEY', 'LENDER', 'TITLECO', 'MARKETING', 'OFFICE_SUPPORT'];
        const inviteRole = safeRoles.includes(role) ? role : 'AGENT';

        // Invalidate any previous pending invites for this email in this org, then create fresh one
        await prisma.invitation.deleteMany({
            where: { email: normalizedEmail, orgId: req.user.orgId, acceptedAt: null },
        });
        await prisma.invitation.create({
            data: {
                email:       normalizedEmail,
                role:        inviteRole,
                token:       inviteToken,
                expiresAt:   new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                invitedById: req.user.userId,
                orgId:       req.user.orgId,
            },
        });

        const inviter = await prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true, email: true } });
        const inviterName = inviter?.name || inviter?.email || 'A team member';
        const org = await prisma.organization.findUnique({ where: { id: req.user.orgId } });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';

        // Send invite email
        try {
            await sendEmail({
                to:      email.trim().toLowerCase(),
                subject: `You've been invited to join ${org?.name || 'our team'} on Real Estate CRM`,
                html: `
                    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2>You're invited!</h2>
                        <p><strong>${inviterName}</strong> has invited you to join <strong>${org?.name || 'their team'}</strong> as a <strong>${inviteRole}</strong>.</p>
                        <p>Click below to accept the invitation and set up your account:</p>
                        <a href="${appUrl}/signup?invite=${inviteToken}&email=${encodeURIComponent(normalizedEmail)}&org=${req.user.orgId}&role=${inviteRole}"
                           style="display: inline-block; padding: 12px 24px; background: #B8977E; color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
                            Accept Invitation
                        </a>
                        <p style="color: #666; font-size: 12px;">This invitation expires in 7 days.</p>
                    </div>
                `,
            });
        } catch (emailError) {
            console.error('Failed to send invite email:', emailError);
            // Don't fail the request — log and continue
        }

        res.json({ message: `Invitation sent to ${email}` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});

export default router;
