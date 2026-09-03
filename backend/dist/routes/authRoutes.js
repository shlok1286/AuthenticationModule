"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("../controllers/authController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = (0, express_1.Router)();
// API Endpoints
router.post('/api/auth/signup', authController_1.signup);
router.post('/api/auth/login', authController_1.login);
router.post('/api/auth/verify-otp', authController_1.verifyOtp);
router.post('/api/auth/resend-otp', authController_1.resendOtp);
router.post('/api/auth/forgot-password', authController_1.forgotPassword);
router.post('/api/auth/reset-password', authController_1.resetPassword);
router.get('/api/auth/me', authMiddleware_1.authenticateJwt, authController_1.getMe);
router.post('/api/auth/logout', authController_1.logout);
// Google OAuth Endpoints
router.get('/auth/google', authController_1.googleAuthRedirect);
router.get('/auth/google/callback', authController_1.googleAuthCallback);
exports.default = router;
