"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const User_1 = require("../models/User");
const authenticateJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized: No token provided' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET || 'super_secret_jwt_key_reusable_auth_module_2026_safe_key_32bytes';
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const user = await User_1.User.findById(decoded.userId).select('-passwordHash');
        if (!user) {
            res.status(401).json({ message: 'Unauthorized: User not found' });
            return;
        }
        req.userRecord = user;
        next();
    }
    catch (error) {
        res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
    }
};
exports.authenticateJwt = authenticateJwt;
