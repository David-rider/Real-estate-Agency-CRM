import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

const JWT_SECRET = process.env.JWT_SECRET as string;

if (!JWT_SECRET) {
    console.error('FATAL ERROR: JWT_SECRET is not defined in environment variables.');
    // In a real production app, we might throw or exit. For safety in development if they didn't set it yet, 
    // we should forcefully exit the process to ensure they set it.
    process.exit(1);
}


// Extend Express Request interface to include user
export interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
        tier: string;
        orgId: string;
    }
}

// Short cache so every request doesn't hit the database
const ACCOUNT_CACHE_MS = 30 * 1000;
const accountCache = new Map<string, { at: number; user: { role: string; tier: string; orgId: string } | null }>();

async function currentAccount(userId: string) {
    const hit = accountCache.get(userId);
    if (hit && Date.now() - hit.at < ACCOUNT_CACHE_MS) return hit.user;
    const u = await prisma.user.findUnique({ where: { id: userId }, select: { role: true, tier: true, orgId: true, isActive: true } });
    const user = u && u.isActive ? { role: u.role, tier: u.tier, orgId: u.orgId } : null;
    accountCache.set(userId, { at: Date.now(), user });
    if (accountCache.size > 5000) accountCache.clear();
    return user;
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    let decoded: AuthRequest['user'];
    try {
        decoded = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] }) as AuthRequest['user'];
    } catch (error) {
        // 401, not 403: the caller is not authenticated. 403 is reserved for
        // "authenticated but not permitted" (role / plan gating), so clients
        // can tell "log in again" apart from "you lack access".
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
    if (!decoded?.userId) return res.status(401).json({ error: 'Invalid or expired token' });

    // A valid signature isn't enough: deleted or deactivated accounts lose access
    // immediately, and role/plan changes apply without waiting for a new token.
    try {
        const account = await currentAccount(decoded.userId);
        if (!account) return res.status(401).json({ error: 'This account is no longer active' });
        req.user = { userId: decoded.userId, ...account };
        next();
    } catch (err) {
        next(err);
    }
};

export const authorizeRole = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        next();
    }
};

const tierWeights: Record<string, number> = {
    'CORE': 1,
    'PRO': 2,
    'ELITE': 3
};

export const requireTier = (minTier: string) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        // Platform admins bypass subscription gating
        if (req.user.role === 'SUPERADMIN') {
            return next();
        }

        const userTierWeight = tierWeights[req.user.tier] || 0;
        const requiredTierWeight = tierWeights[minTier] || 0;

        if (userTierWeight < requiredTierWeight) {
            return res.status(403).json({ 
                error: `This feature requires a ${minTier} subscription.`,
                requiredTier: minTier
            });
        }

        next();
    }
};
