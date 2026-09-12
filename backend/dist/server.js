"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const db_1 = require("./db");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
// Security & Middleware
app.use((0, helmet_1.default)({
    contentSecurityPolicy: false // Allow OAuth redirects and inline resources for dev
}));
app.use((0, cors_1.default)({
    origin: FRONTEND_URL,
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use((0, cookie_parser_1.default)());
const authRateLimiter = (0, express_rate_limit_1.default)({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false
});
app.use('/api/auth', authRateLimiter);
// Routes
app.use('/', authRoutes_1.default);
// Health check endpoint
app.get('/health', async (req, res) => {
    try {
        const health = await (0, db_1.getDatabaseAdapter)().getHealth();
        res.status(health.connected ? 200 : 503).json({
            status: health.status,
            database: health.connected ? 'connected' : 'disconnected',
            provider: health.provider
        });
    }
    catch (err) {
        res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
    }
});
// Database Connection & Server Bootstrap
const startServer = async () => {
    try {
        const provider = (0, db_1.getDatabaseProvider)();
        await (0, db_1.initDatabase)();
        const server = app.listen(PORT, () => {
            console.log(`Backend server running on http://localhost:${PORT} with [${provider.toUpperCase()}] database`);
        });
        server.on('error', (err) => {
            if (err.code === 'EADDRINUSE') {
                console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
                console.error(`Please stop the existing process running on port ${PORT} or restart your shell.\n`);
            }
            else {
                console.error('Server error:', err);
            }
        });
    }
    catch (error) {
        console.error('Failed to connect to database:', error);
        process.exit(1);
    }
};
startServer();
