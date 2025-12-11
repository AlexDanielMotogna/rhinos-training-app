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
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // 'lax' works with subdomain
    secure: process.env.NODE_ENV === 'production',
    domain: process.env.NODE_ENV === 'production' ? '.rhinos-training.at' : undefined, // Share cookie across subdomain
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
