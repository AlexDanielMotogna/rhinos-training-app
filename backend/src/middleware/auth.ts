import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt.js';
import { logger } from '../utils/logger.js';

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
    // Try to get token from cookie first (new secure method)
    let token = req.cookies?.auth_token;

    // Fall back to Authorization header for backward compatibility
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }

    if (!token) {
      logger.debug('No auth token provided in cookie or header');
      return res.status(401).json({ error: 'No token provided' });
    }

    const decoded = verifyToken(token);
    req.user = decoded;

    logger.debug(`Authenticated user: ${decoded.email}`, { role: decoded.role });
    next();
  } catch (error) {
    logger.error('Authentication error', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

export function requireCoach(req: Request, res: Response, next: NextFunction) {
  if (req.user?.role !== 'coach') {
    return res.status(403).json({ error: 'Coach access required' });
  }
  next();
}
