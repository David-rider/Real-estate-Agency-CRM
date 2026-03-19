import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

dotenv.config();

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
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Real Estate Brokerage Management Platform Agent CRM API is running.', timestamp: new Date().toISOString() });
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

export { app, prisma };
