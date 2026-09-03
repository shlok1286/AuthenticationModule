"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const mongoose_1 = __importDefault(require("mongoose"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentication';
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
// Routes
app.use('/', authRoutes_1.default);
// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok', database: mongoose_1.default.connection.readyState === 1 ? 'connected' : 'disconnected' });
});
// Database Connection & Server Bootstrap
const startServer = async () => {
    try {
        await mongoose_1.default.connect(MONGODB_URI);
        console.log(`Successfully connected to MongoDB at: ${MONGODB_URI}`);
        const server = app.listen(PORT, () => {
            console.log(`Backend server running on http://localhost:${PORT}`);
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
        console.error('Failed to connect to MongoDB:', error);
        process.exit(1);
    }
};
startServer();
