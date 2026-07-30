"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.app = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
dotenv_1.default.config();
// Validate required environment variables
const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET'];
const missingEnvVars = requiredEnvVars.filter(v => !process.env[v]);
if (missingEnvVars.length > 0) {
    console.error(`FATAL: Missing required environment variables: ${missingEnvVars.join(', ')}`);
    process.exit(1);
}
const app = (0, express_1.default)();
exports.app = app;
const prisma = new client_1.PrismaClient();
exports.prisma = prisma;
const PORT = process.env.PORT || 4000;
const clients_1 = __importDefault(require("./routes/clients"));
const properties_1 = __importDefault(require("./routes/properties"));
const transactions_1 = __importDefault(require("./routes/transactions"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const marketing_1 = __importDefault(require("./routes/marketing"));
const auth_1 = __importDefault(require("./routes/auth"));
const finance_1 = __importDefault(require("./routes/finance"));
const settings_1 = __importDefault(require("./routes/settings"));
const offers_1 = __importDefault(require("./routes/offers"));
const documents_1 = __importDefault(require("./routes/documents"));
const appointments_1 = __importDefault(require("./routes/appointments"));
const media_1 = __importDefault(require("./routes/media"));
const marketing_tasks_1 = __importDefault(require("./routes/marketing-tasks"));
const referrals_1 = __importDefault(require("./routes/referrals"));
const gifts_1 = __importDefault(require("./routes/gifts"));
const oauth_1 = __importDefault(require("./routes/oauth"));
const importExport_1 = __importDefault(require("./routes/importExport"));
const payments_1 = __importDefault(require("./routes/payments"));
const integrations_1 = __importDefault(require("./routes/integrations"));
const tasks_1 = __importDefault(require("./routes/tasks"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const search_1 = __importDefault(require("./routes/search"));
const authMiddleware_1 = require("./middleware/authMiddleware");
// Middleware
// In production an explicit FRONTEND_URL allowlist is mandatory: falling back to
// '*' alongside credentials:true would be an origin-unrestricted credentialed API.
if (process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL) {
    console.error('FATAL: FRONTEND_URL must be set in production (CORS allowlist)');
    process.exit(1);
}
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*';
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
// Stripe webhook needs raw body — must be before express.json()
app.use('/api/payments/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/oauth', oauth_1.default);
// Protected Routes
app.use('/api/clients', authMiddleware_1.authenticateToken, clients_1.default);
app.use('/api/properties', properties_1.default); // Public /public route + self-managed auth via router.use(authenticateToken)
app.use('/api/transactions', authMiddleware_1.authenticateToken, transactions_1.default);
app.use('/api/dashboard', authMiddleware_1.authenticateToken, dashboard_1.default);
app.use('/api/marketing', authMiddleware_1.authenticateToken, marketing_1.default);
app.use('/api/finance', authMiddleware_1.authenticateToken, finance_1.default);
app.use('/api/settings', authMiddleware_1.authenticateToken, settings_1.default);
app.use('/api/settings/users', authMiddleware_1.authenticateToken, importExport_1.default);
app.use('/api/offers', authMiddleware_1.authenticateToken, offers_1.default);
app.use('/api/documents', authMiddleware_1.authenticateToken, documents_1.default);
app.use('/api/appointments', authMiddleware_1.authenticateToken, appointments_1.default);
app.use('/api/media', authMiddleware_1.authenticateToken, media_1.default);
app.use('/api/marketing-tasks', authMiddleware_1.authenticateToken, marketing_tasks_1.default);
app.use('/api/referrals', authMiddleware_1.authenticateToken, referrals_1.default);
app.use('/api/gifts', authMiddleware_1.authenticateToken, gifts_1.default);
app.use('/api/integrations', authMiddleware_1.authenticateToken, integrations_1.default);
app.use('/api/tasks', tasks_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/search', search_1.default);
app.use('/api/payments', payments_1.default);
// Basic Health Check Route
app.get('/api/health', async (req, res) => {
    try {
        await prisma.$queryRaw `SELECT 1`;
        res.status(200).json({ status: 'ok', db: 'connected', timestamp: new Date().toISOString() });
    }
    catch {
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
app.use((err, req, res, _next) => {
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
const shutdown = async (signal) => {
    console.log(`${signal} received — shutting down gracefully`);
    server.close(async () => {
        await prisma.$disconnect();
        console.log('Database disconnected. Bye.');
        process.exit(0);
    });
};
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
