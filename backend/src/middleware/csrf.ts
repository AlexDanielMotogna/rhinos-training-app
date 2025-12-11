import { doubleCsrf } from 'csrf-csrf';

// CSRF protection configuration
const {
  generateToken, // Generates a new CSRF token
  doubleCsrfProtection, // The middleware that validates CSRF tokens
} = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET || 'default-csrf-secret-change-in-production',
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  },
  size: 64,
  ignoredMethods: ['GET', 'HEAD', 'OPTIONS'],
  getTokenFromRequest: (req) => {
    // Try to get token from header first
    return req.headers['x-csrf-token'] as string || req.body?._csrf;
  },
});

export { generateToken, doubleCsrfProtection };
