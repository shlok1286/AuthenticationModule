import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/authRoutes';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/authentication';
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
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected' });
});

// Database Connection & Server Bootstrap
const startServer = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log(`Successfully connected to MongoDB at: ${MONGODB_URI}`);

    const server = app.listen(PORT, () => {
      console.log(`Backend server running on http://localhost:${PORT}`);
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
    console.error('Failed to connect to MongoDB:', error);
    process.exit(1);
  }
};

startServer();
