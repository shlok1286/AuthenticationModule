import { Router } from 'express';
import {
  signup,
  login,
  verifyOtp,
  resendOtp,
  forgotPassword,
  resetPassword,
  getMe,
  logout,
  googleAuthRedirect,
  googleAuthCallback
} from '../controllers/authController';
import { authenticateJwt } from '../middleware/authMiddleware';

const router = Router();

// API Endpoints
router.post('/api/auth/signup', signup);
router.post('/api/auth/login', login);
router.post('/api/auth/verify-otp', verifyOtp);
router.post('/api/auth/resend-otp', resendOtp);
router.post('/api/auth/forgot-password', forgotPassword);
router.post('/api/auth/reset-password', resetPassword);
router.get('/api/auth/me', authenticateJwt, getMe);
router.post('/api/auth/logout', logout);

// Google OAuth Endpoints
router.get('/auth/google', googleAuthRedirect);
router.get('/auth/google/callback', googleAuthCallback);

export default router;
