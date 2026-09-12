"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJwt = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const authenticateJwt = async (req, res, next) => {
    try {
        const token = req.cookies?.auth_token || req.headers.authorization?.split(' ')[1];
        if (!token) {
            res.status(401).json({ message: 'Unauthorized: No token provided' });
            return;
        }
        const jwtSecret = process.env.JWT_SECRET;
        if (!jwtSecret) {
            res.status(500).json({ message: 'JWT_SECRET is not configured.' });
            return;
        }
        const decoded = jsonwebtoken_1.default.verify(token, jwtSecret);
        const userRepo = (0, db_1.getDatabaseAdapter)().getUserRepository();
        const user = await userRepo.findById(decoded.userId);
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
