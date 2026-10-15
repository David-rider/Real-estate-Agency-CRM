"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.audit = audit;
const server_1 = require("../server");
// Records a sensitive action in the org's audit trail.
// Never throws — an audit-write failure must not fail the business operation itself.
async function audit(req, action, entity, entityId, before, after) {
    if (!req.user)
        return;
    try {
        await server_1.prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                before: before === undefined ? null : JSON.stringify(before),
                after: after === undefined ? null : JSON.stringify(after),
                ipAddress: req.ip ?? null,
                userAgent: req.headers['user-agent']?.slice(0, 300) ?? null,
                userId: req.user.userId,
                orgId: req.user.orgId,
            },
        });
    }
    catch (err) {
        console.error(`Audit write failed for ${action}:`, err);
    }
}
