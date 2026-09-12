import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { getDatabaseAdapter } from '../db';

export const authenticateJwt = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
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
    const decoded = jwt.verify(token, jwtSecret) as { userId: string };

    const userRepo = getDatabaseAdapter().getUserRepository();
    const user = await userRepo.findById(decoded.userId);
    if (!user) {
      res.status(401).json({ message: 'Unauthorized: User not found' });
      return;
    }

    (req as any).userRecord = user;
    next();
  } catch (error) {
    res.status(401).json({ message: 'Unauthorized: Invalid or expired token' });
  }
};
