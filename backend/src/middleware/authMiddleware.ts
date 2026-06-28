import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env';

export interface AuthRequest extends Request {
  recruiter?: { email: string };
}

/**
 * Middleware to protect routes — requires valid JWT in cookie or Authorization header
 */
export function requireAuth(req: AuthRequest, res: Response, next: NextFunction): void {
  // Try cookie first, then Authorization header
  const token =
    req.cookies?.smarthire_token ||
    req.headers.authorization?.replace('Bearer ', '');

  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, config.jwtSecret) as { email: string };
    req.recruiter = { email: decoded.email };
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}
