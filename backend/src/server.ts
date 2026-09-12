import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';
import { initDatabase, getDatabaseAdapter, getDatabaseProvider } from './db';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

// Security & Middleware
app.use(helmet({
  contentSecurityPolicy: false // Allow OAuth redirects and inline resources for dev
}));
app.use(cors({
  origin: FRONTEND_URL,
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/auth', authRateLimiter);

// Routes
app.use('/', authRoutes);

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const health = await getDatabaseAdapter().getHealth();
    res.status(health.connected ? 200 : 503).json({
      status: health.status,
      database: health.connected ? 'connected' : 'disconnected',
      provider: health.provider
    });
  } catch (err: any) {
    res.status(503).json({ status: 'error', database: 'disconnected', error: err.message });
  }
});

// Database Connection & Server Bootstrap
const startServer = async () => {
  try {
    const provider = getDatabaseProvider();
    await initDatabase();

    const server = app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT} with [${provider.toUpperCase()}] database`);
    });

    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`\n❌ Error: Port ${PORT} is already in use by another process.`);
        console.error(`Please stop the existing process running on port ${PORT} or restart your shell.\n`);
      } else {
        console.error('Server error:', err);
      }
    });
  } catch (error) {
    console.error('Failed to connect to database:', error);
    process.exit(1);
  }
};

startServer();
