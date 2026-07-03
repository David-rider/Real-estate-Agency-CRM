"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SEAT_LIMITS = void 0;
exports.getSeatUsage = getSeatUsage;
const server_1 = require("../server");
// Seat limits per organization subscription level (see USER_GUIDE §16.1)
// null = unlimited
exports.SEAT_LIMITS = {
    BASIC: 3,
    PRO: 15,
    ENTERPRISE: null,
};
async function getSeatUsage(orgId) {
    const org = await server_1.prisma.organization.findUnique({ where: { id: orgId } });
    const subscription = org?.subscription || 'BASIC';
    const limit = exports.SEAT_LIMITS[subscription] ?? exports.SEAT_LIMITS.BASIC;
    const [users, pendingInvites] = await Promise.all([
        server_1.prisma.user.count({ where: { orgId } }),
        server_1.prisma.invitation.count({
            where: { orgId, acceptedAt: null, expiresAt: { gt: new Date() } },
        }),
    ]);
    return { limit, users, pendingInvites, subscription };
}
