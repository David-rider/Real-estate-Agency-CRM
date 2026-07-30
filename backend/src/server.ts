import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

import clientRoutes from './routes/clients';
import propertyRoutes from './routes/properties';
import transactionRoutes from './routes/transactions';
import dashboardRoutes from './routes/dashboard';
import marketingRoutes from './routes/marketing';
import authRoutes from './routes/auth';
import financeRoutes from './routes/finance';
import settingsRoutes from './routes/settings';
import offersRoutes from './routes/offers';
import documentsRoutes from './routes/documents';
import appointmentsRoutes from './routes/appointments';
import mediaRoutes from './routes/media';
import marketingTasksRoutes from './routes/marketing-tasks';
import referralsRoutes from './routes/referrals';
import giftsRoutes from './routes/gifts';
import oauthRoutes from './routes/oauth';
import importExportRoutes from './routes/importExport';
import paymentRoutes from './routes/payments';
import integrationsRoutes from './routes/integrations';
import tasksRoutes from './routes/tasks';
import notificationsRoutes from './routes/notifications';
import searchRoutes from './routes/search';

import { authenticateToken } from './middleware/authMiddleware';

// Middleware
// In production an explicit FRONTEND_URL allowlist is mandatory: falling back to
// '*' alongside credentials:true would be an origin-unrestricted credentialed API.
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    console.error('FATAL: FRONTEND_URL must be set in production (CORS allowlist)');
    process.exit(1);
}
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*';
app.use(cors({
    origin: allowedOrigins,
    credentials: true,
}));
// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/oauth', oauthRoutes);

// Protected Routes
app.use('/api/clients', authenticateToken, clientRoutes);
app.use('/api/properties', propertyRoutes); // Public /public route + self-managed auth via router.use(authenticateToken)
app.use('/api/transactions', authenticateToken, transactionRoutes);
app.use('/api/dashboard', authenticateToken, dashboardRoutes);
app.use('/api/marketing', authenticateToken, marketingRoutes);
app.use('/api/finance', authenticateToken, financeRoutes);
app.use('/api/settings', authenticateToken, settingsRoutes);
app.use('/api/settings/users', authenticateToken, importExportRoutes);
app.use('/api/offers', authenticateToken, offersRoutes);
app.use('/api/documents', authenticateToken, documentsRoutes);
app.use('/api/appointments', authenticateToken, appointmentsRoutes);
app.use('/api/media', authenticateToken, mediaRoutes);
app.use('/api/marketing-tasks', authenticateToken, marketingTasksRoutes);
app.use('/api/referrals', authenticateToken, referralsRoutes);
app.use('/api/gifts', authenticateToken, giftsRoutes);
app.use('/api/integrations', authenticateToken, integrationsRoutes);
app.use('/api/tasks',         tasksRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/search',        searchRoutes);
app.use('/api/payments',      paymentRoutes);

// Basic Health Check Route
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch {
        res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
    }
});

// 404 — this is a JSON API, so unknown routes must not fall through to
// Express's default HTML error page
app.use((req, res) => {
    res.status(404).json({ error: 'Not found', path: req.path });
});

// Global error handler. Express 5 forwards async route rejections here.
// Internal error details are logged server-side but never returned to the client.
app.use((err: any, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('Unhandled error:', err);

    // Malformed JSON bodies surface as a SyntaxError from express.json()
    if (err instanceof SyntaxError && 'body' in err) {
        return res.status(400).json({ error: 'Malformed JSON in request body' });
    }
    if (err?.type === 'entity.too.large') {
        return res.status(413).json({ error: 'Request payload too large' });
    }
    // CORS rejections
    if (typeof err?.message === 'string' && err.message.includes('Not allowed by CORS')) {
        return res.status(403).json({ error: 'Origin not allowed' });
    }

    res.status(err?.status || 500).json({ error: 'Internal server error' });
});

// Start Server
const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
});

const shutdown = async (signal: string) => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Bye.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, prisma };
