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

import { authenticateToken } from './middleware/authMiddleware';

// Middleware
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
app.use('/api/properties', authenticateToken, propertyRoutes);
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

// Basic Health Check Route
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;
        res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    } catch {
        res.status(503).json({ status: 'error', db: 'disconnected', timestamp: new Date().toISOString() });
    }
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
