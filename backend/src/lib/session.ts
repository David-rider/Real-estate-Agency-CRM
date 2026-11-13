import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { setAuthCookie } from '../middleware/authMiddleware';
import { recordLogin } from './loginAlert';

type SessionUser = { id: string; name: string; email: string; role: string; tier: string; orgId: string };

/** Issue the session for a fully authenticated user (password or social sign-in, plus 2FA when on). */
export function issueSession(prisma: PrismaClient, req: express.Request, res: express.Response, user: SessionUser) {
    const token = jwt.sign(
        { userId: user.id, role: user.role, tier: user.tier, orgId: user.orgId },
        process.env.JWT_SECRET as string,
        { expiresIn: '24h' },
    );
    setAuthCookie(res, token);
    void recordLogin(prisma, user.id, String(req.headers['user-agent'] ?? ''), req.ip ?? '');
    res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role, tier: user.tier, orgId: user.orgId },
    });
}
