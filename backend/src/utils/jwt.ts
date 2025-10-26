import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyToken(token: string): JWTPayload {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
}

export function generatePasswordResetToken(userId: string): string {
  return jwt.sign({ userId, type: 'reset' }, JWT_SECRET, { expiresIn: '1h' });
}

export function verifyPasswordResetToken(token: string): { userId: string } {
  const decoded = jwt.verify(token, JWT_SECRET) as any;
  if (decoded.type !== 'reset') {
    throw new Error('Invalid token type');
  }
  return { userId: decoded.userId };
}
