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
const integrations_1 = __importDefault(require("./routes/integrations"));
const authMiddleware_1 = require("./middleware/authMiddleware");
// Middleware
const allowedOrigins = process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : '*';
app.use((0, cors_1.default)({
    origin: allowedOrigins,
    credentials: true,
}));
app.use(express_1.default.json());
// Routes
app.use('/api/auth', auth_1.default);
app.use('/api/oauth', oauth_1.default);
// Protected Routes
app.use('/api/clients', authMiddleware_1.authenticateToken, clients_1.default);
app.use('/api/properties', authMiddleware_1.authenticateToken, properties_1.default);
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
// Basic Health Check Route
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok', message: 'Real Estate Brokerage Management Platform Agent CRM API is running.', timestamp: new Date().toISOString() });
});
// Start Server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
