import express from 'express';
import { generateToken } from '../middleware/csrf.js';

const router = express.Router();

// GET /api/csrf-token - Get CSRF token for authenticated users
router.get('/csrf-token', (req, res) => {
  try {
    const csrfToken = generateToken(req, res);
    res.json({ csrfToken });
  } catch (error) {
    console.error('[CSRF] Error generating token:', error);
    res.status(500).json({ error: 'Failed to generate CSRF token' });
  }
});

export default router;
