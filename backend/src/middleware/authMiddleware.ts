import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

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

export const authenticateToken = (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Authentication required' });
    }

    try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthRequest['user'];
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(403).json({ error: 'Invalid or expired token' });
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
