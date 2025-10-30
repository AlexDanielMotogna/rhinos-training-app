import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      console.error('[AUTH] No token provided. Headers:', {
        authorization: authHeader,
        contentType: req.headers['content-type'],
        method: req.method,
        path: req.path,
      });
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    const decoded = verifyToken(token);
    req.user = decoded;

    console.log(`[AUTH] Authenticated user: ${decoded.email} (${decoded.role})`);
    next();
  } catch (error) {
    console.error('[AUTH] Authentication error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'coach') {
    return res.status(403).json({ error: 'Coach access required' });
  }
  next();
}
