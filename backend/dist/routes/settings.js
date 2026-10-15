"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const server_1 = require("../server");
const authMiddleware_1 = require("../middleware/authMiddleware");
const crypto_1 = __importDefault(require("crypto"));
const email_1 = require("../lib/email");
const seats_1 = require("../lib/seats");
const audit_1 = require("../lib/audit");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticateToken);
const ADMIN_ROLES = ['SUPERADMIN', 'FIRMADMIN'];
// Trims a value and caps its length; empty strings become null so cleared fields are cleared
const clean = (v, max = 500) => {
    if (v === undefined)
        return undefined;
    if (v === null)
        return null;
    const s = String(v).trim().slice(0, max);
    return s === '' ? null : s;
};
// ─── Own profile ─────────────────────────────────────────────────────────────
const PROFILE_SELECT = {
    id: true, name: true, email: true, role: true, tier: true,
    title: true, phone: true, licenseNumber: true, linkedIn: true,
    bio: true, timezone: true, avatarUrl: true,
};
// GET /api/settings/profile — the caller's own profile
router.get('/profile', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const me = await server_1.prisma.user.findUnique({ where: { id: req.user.userId }, select: PROFILE_SELECT });
        if (!me)
            return res.status(404).json({ error: 'User not found' });
        res.json(me);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load profile' });
    }
});
// PATCH /api/settings/profile — update the caller's own profile.
// Only personal fields are writable here; role/tier/email/orgId are not.
router.patch('/profile', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name, title, phone, licenseNumber, linkedIn, bio, timezone } = req.body;
        if (name !== undefined && !String(name).trim()) {
            return res.status(400).json({ error: 'Name cannot be empty' });
        }
        const updated = await server_1.prisma.user.update({
            where: { id: req.user.userId },
            data: {
                ...(name !== undefined ? { name: String(name).trim().slice(0, 120) } : {}),
                title: clean(title, 120),
                phone: clean(phone, 40),
                licenseNumber: clean(licenseNumber, 60),
                linkedIn: clean(linkedIn, 300),
                bio: clean(bio, 2000),
                ...(timezone ? { timezone: String(timezone).slice(0, 60) } : {}),
            },
            select: PROFILE_SELECT,
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update profile' });
    }
});
// ─── Organization ────────────────────────────────────────────────────────────
// GET /api/settings/organization — org details, plan and seat usage (any member)
router.get('/organization', async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const org = await server_1.prisma.organization.findUnique({
            where: { id: req.user.orgId },
            select: { id: true, name: true, website: true, address: true, phone: true, licenseNumber: true, logoUrl: true, subscription: true },
        });
        if (!org)
            return res.status(404).json({ error: 'Organization not found' });
        const seats = await (0, seats_1.getSeatUsage)(req.user.orgId);
        res.json({ ...org, seats: { limit: seats.limit, used: seats.users, pendingInvites: seats.pendingInvites } });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to load organization' });
    }
});
// PATCH /api/settings/organization — update firm details (org admins only)
router.patch('/organization', (0, authMiddleware_1.authorizeRole)(ADMIN_ROLES), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { name, website, address, phone, licenseNumber, logoUrl } = req.body;
        if (name !== undefined && !String(name).trim()) {
            return res.status(400).json({ error: 'Company name cannot be empty' });
        }
        for (const [field, val] of [['website', website], ['logoUrl', logoUrl]]) {
            if (val && !/^https?:\/\//i.test(String(val).trim())) {
                return res.status(400).json({ error: `${field} must start with http:// or https://` });
            }
        }
        const before = await server_1.prisma.organization.findUnique({
            where: { id: req.user.orgId },
            select: { name: true, website: true, address: true, phone: true, licenseNumber: true, logoUrl: true },
        });
        const updated = await server_1.prisma.organization.update({
            where: { id: req.user.orgId },
            data: {
                ...(name !== undefined ? { name: String(name).trim().slice(0, 200) } : {}),
                website: clean(website, 300),
                address: clean(address, 300),
                phone: clean(phone, 40),
                licenseNumber: clean(licenseNumber, 60),
                logoUrl: clean(logoUrl, 500),
            },
            select: { id: true, name: true, website: true, address: true, phone: true, licenseNumber: true, logoUrl: true, subscription: true },
        });
        await (0, audit_1.audit)(req, 'UPDATE_ORGANIZATION', 'Organization', updated.id, before, {
            name: updated.name, website: updated.website, address: updated.address,
            phone: updated.phone, licenseNumber: updated.licenseNumber, logoUrl: updated.logoUrl,
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update organization' });
    }
});
// GET /api/settings/organization/export — full data export of the caller's org (GDPR-style portability)
// Secrets (password hashes, reset/verify tokens, invite tokens) are never included.
router.get('/organization/export', (0, authMiddleware_1.authorizeRole)(ADMIN_ROLES), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const orgId = req.user.orgId;
        const where = { orgId };
        const [organization, users, clients, properties, transactions, commissions, offers, appointments, tasks, notes, documents, mediaAssets, referrals, giftOrders, marketingTasks] = await Promise.all([
            server_1.prisma.organization.findUnique({ where: { id: orgId } }),
            server_1.prisma.user.findMany({ where, select: {
                    id: true, name: true, email: true, role: true, tier: true, title: true, phone: true,
                    licenseNumber: true, linkedIn: true, bio: true, timezone: true, isActive: true,
                    emailVerified: true, lastLoginAt: true, createdAt: true,
                } }),
            server_1.prisma.client.findMany({ where }),
            server_1.prisma.property.findMany({ where }),
            server_1.prisma.transaction.findMany({ where }),
            server_1.prisma.commission.findMany({ where }),
            server_1.prisma.offer.findMany({ where }),
            server_1.prisma.appointment.findMany({ where }),
            server_1.prisma.task.findMany({ where }),
            server_1.prisma.note.findMany({ where }),
            server_1.prisma.document.findMany({ where }),
            server_1.prisma.mediaAsset.findMany({ where }),
            server_1.prisma.referral.findMany({ where }),
            server_1.prisma.giftOrder.findMany({ where }),
            server_1.prisma.marketingTask.findMany({ where }),
        ]);
        const stamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename="org-export-${stamp}.json"`);
        res.json({
            exportedAt: new Date().toISOString(),
            exportedBy: req.user.userId,
            organization, users, clients, properties, transactions, commissions, offers,
            appointments, tasks, notes, documents, mediaAssets, referrals, giftOrders, marketingTasks,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to export organization data' });
    }
});
// GET /api/settings/organization/audit-log — audit trail for the caller's org
router.get('/organization/audit-log', (0, authMiddleware_1.authorizeRole)(ADMIN_ROLES), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const logs = await server_1.prisma.auditLog.findMany({
            where: { orgId: req.user.orgId },
            include: { user: { select: { name: true, email: true } } },
            orderBy: { createdAt: 'desc' },
            take: 5000,
        });
        const stamp = new Date().toISOString().slice(0, 10);
        res.setHeader('Content-Disposition', `attachment; filename="audit-log-${stamp}.json"`);
        res.json({ exportedAt: new Date().toISOString(), count: logs.length, logs });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to export audit log' });
    }
});
// GET /api/settings/users — list all org users
router.get('/users', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const users = await server_1.prisma.user.findMany({
            where: { orgId: req.user.orgId },
            select: {
                id: true, name: true, email: true, role: true, tier: true,
                phone: true, title: true, licenseNumber: true, avatarUrl: true,
                emailVerified: true, isActive: true, lastLoginAt: true, createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});
const VALID_ROLES = ['SUPERADMIN', 'FIRMADMIN', 'MANAGER', 'AGENT', 'ATTORNEY', 'LENDER', 'TITLECO', 'MARKETING', 'OFFICE_SUPPORT'];
const ROLE_RANK = { SUPERADMIN: 3, FIRMADMIN: 2, MANAGER: 1 };
// Shared role-change logic for the PATCH and legacy PUT endpoints.
// Tier is deliberately NOT accepted: it is derived from the org's paid subscription,
// so letting admins set it per-user would bypass billing.
async function changeRole(req, res) {
    if (!req.user)
        return res.status(401).json({ error: 'Unauthorized' });
    const { role } = req.body;
    if (!role || !VALID_ROLES.includes(role)) {
        return res.status(400).json({ error: 'A valid role is required' });
    }
    // SUPERADMIN is a platform-level role — only an existing SUPERADMIN may grant it
    if (role === 'SUPERADMIN' && req.user.role !== 'SUPERADMIN') {
        return res.status(403).json({ error: 'Only a platform administrator can assign SUPERADMIN' });
    }
    // Managers cannot elevate anyone to FIRMADMIN
    if (req.user.role === 'MANAGER' && role === 'FIRMADMIN') {
        return res.status(403).json({ error: 'Insufficient permissions to assign this role' });
    }
    const target = await server_1.prisma.user.findFirst({
        where: { id: String(req.params.id), orgId: req.user.orgId },
    });
    if (!target)
        return res.status(404).json({ error: 'User not found in your organization' });
    // Nobody may change the role of someone ranked at or above themselves
    // (prevents a manager demoting their firm admin, or a firm admin touching a superadmin)
    if (target.id !== req.user.userId && (ROLE_RANK[target.role] || 0) >= (ROLE_RANK[req.user.role] || 0)) {
        return res.status(403).json({ error: 'You cannot change the role of a user at or above your own level' });
    }
    const updated = await server_1.prisma.user.update({
        where: { id: target.id },
        data: { role },
        select: { id: true, name: true, role: true, tier: true },
    });
    await (0, audit_1.audit)(req, 'UPDATE_ROLE', 'User', target.id, { role: target.role }, { role: updated.role });
    res.json(updated);
}
// PATCH /api/settings/users/:id — change a member's role (settings page calls PATCH)
router.patch('/users/:id', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        await changeRole(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});
// PUT /api/settings/users/:id/role — legacy endpoint kept for compatibility
router.put('/users/:id/role', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN']), async (req, res) => {
    try {
        await changeRole(req, res);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to update user role' });
    }
});
// DELETE /api/settings/users/:id — deactivate (soft delete: set role to OFFICE_SUPPORT with no access)
router.delete('/users/:id', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        // Prevent self-deletion
        if (String(req.params.id) === req.user.userId) {
            return res.status(400).json({ error: 'Cannot deactivate your own account' });
        }
        const target = await server_1.prisma.user.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        if (target.role === 'SUPERADMIN')
            return res.status(403).json({ error: 'Cannot deactivate superadmin' });
        // Real deactivation — login and token refresh are refused while inactive
        await server_1.prisma.user.update({
            where: { id: String(req.params.id) },
            data: { isActive: false },
        });
        await (0, audit_1.audit)(req, 'DEACTIVATE_USER', 'User', target.id, { isActive: true }, { isActive: false });
        res.json({ message: 'User deactivated' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to deactivate user' });
    }
});
// PATCH /api/settings/users/:id/reactivate — restore a deactivated account
router.patch('/users/:id/reactivate', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const target = await server_1.prisma.user.findFirst({
            where: { id: String(req.params.id), orgId: req.user.orgId },
        });
        if (!target)
            return res.status(404).json({ error: 'User not found' });
        if (target.isActive)
            return res.status(400).json({ error: 'User is already active' });
        // Reactivation takes a seat back — respect the plan limit
        const seats = await (0, seats_1.getSeatUsage)(req.user.orgId);
        if (seats.limit !== null && seats.users + seats.pendingInvites >= seats.limit) {
            return res.status(403).json({
                error: `Your ${seats.subscription} plan allows up to ${seats.limit} team members. Upgrade your plan to reactivate this account.`,
                code: 'SEAT_LIMIT_REACHED',
            });
        }
        const updated = await server_1.prisma.user.update({
            where: { id: target.id },
            data: { isActive: true },
            select: { id: true, name: true, isActive: true },
        });
        await (0, audit_1.audit)(req, 'REACTIVATE_USER', 'User', target.id, { isActive: false }, { isActive: true });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to reactivate user' });
    }
});
// POST /api/settings/invite — invite a team member by email
router.post('/invite', (0, authMiddleware_1.authorizeRole)(['SUPERADMIN', 'FIRMADMIN', 'MANAGER']), async (req, res) => {
    try {
        if (!req.user)
            return res.status(401).json({ error: 'Unauthorized' });
        const { email, role } = req.body;
        if (!email?.trim())
            return res.status(400).json({ error: 'Email is required' });
        // Prevent managers from inviting FIRMADMIN/SUPERADMIN
        if (req.user.role === 'MANAGER' && (role === 'FIRMADMIN' || role === 'SUPERADMIN')) {
            return res.status(403).json({ error: 'Insufficient permissions to invite this role' });
        }
        // Check if already a member
        const existing = await server_1.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
        if (existing) {
            if (existing.orgId === req.user.orgId) {
                return res.status(409).json({ error: 'This email is already a member of your organization' });
            }
            return res.status(409).json({ error: 'This email is already registered' });
        }
        // Seat limit — pending invites reserve seats so admins can't over-invite
        const seats = await (0, seats_1.getSeatUsage)(req.user.orgId);
        if (seats.limit !== null && seats.users + seats.pendingInvites >= seats.limit) {
            return res.status(403).json({
                error: `Your ${seats.subscription} plan allows up to ${seats.limit} team members (${seats.users} active, ${seats.pendingInvites} invited). Upgrade your plan to add more seats.`,
                code: 'SEAT_LIMIT_REACHED',
            });
        }
        // Generate invite token and persist it — accept-invite validates against this record
        const inviteToken = crypto_1.default.randomBytes(32).toString('hex');
        const normalizedEmail = email.trim().toLowerCase();
        const safeRoles = ['AGENT', 'MANAGER', 'ATTORNEY', 'LENDER', 'TITLECO', 'MARKETING', 'OFFICE_SUPPORT'];
        const inviteRole = safeRoles.includes(role) ? role : 'AGENT';
        // Invalidate any previous pending invites for this email in this org, then create fresh one
        await server_1.prisma.invitation.deleteMany({
            where: { email: normalizedEmail, orgId: req.user.orgId, acceptedAt: null },
        });
        const invitation = await server_1.prisma.invitation.create({
            data: {
                email: normalizedEmail,
                role: inviteRole,
                token: inviteToken,
                expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
                invitedById: req.user.userId,
                orgId: req.user.orgId,
            },
        });
        // Token is a credential — never write it to the audit trail
        await (0, audit_1.audit)(req, 'INVITE_MEMBER', 'Invitation', invitation.id, undefined, { email: normalizedEmail, role: inviteRole });
        const inviter = await server_1.prisma.user.findUnique({ where: { id: req.user.userId }, select: { name: true, email: true } });
        const inviterName = inviter?.name || inviter?.email || 'A team member';
        const org = await server_1.prisma.organization.findUnique({ where: { id: req.user.orgId } });
        const appUrl = process.env.APP_URL || 'http://localhost:3000';
        // Send invite email
        try {
            await (0, email_1.sendEmail)({
                to: email.trim().toLowerCase(),
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
        }
        catch (emailError) {
            console.error('Failed to send invite email:', emailError);
            // Don't fail the request — log and continue
        }
        res.json({ message: `Invitation sent to ${email}` });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Failed to send invitation' });
    }
});
exports.default = router;
