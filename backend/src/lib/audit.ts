import { prisma } from '../server';
import { AuthRequest } from '../middleware/authMiddleware';

// Records a sensitive action in the org's audit trail.
// Never throws — an audit-write failure must not fail the business operation itself.
export async function audit(
    req: AuthRequest,
    action: string,
    entity: string,
    entityId: string | null,
    before?: unknown,
    after?: unknown,
): Promise<void> {
    if (!req.user) return;
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entity,
                entityId,
                before:    before === undefined ? null : JSON.stringify(before),
                after:     after  === undefined ? null : JSON.stringify(after),
                ipAddress: req.ip ?? null,
                userAgent: (req.headers['user-agent'] as string | undefined)?.slice(0, 300) ?? null,
                userId:    req.user.userId,
                orgId:     req.user.orgId,
            },
        });
    } catch (err) {
        console.error(`Audit write failed for ${action}:`, err);
    }
}
