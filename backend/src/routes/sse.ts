import express from 'express';
import jwt from 'jsonwebtoken';
import { sseManager } from '../utils/sseManager.js';
import { randomUUID } from 'crypto';

const router = express.Router();

/**
 * Authenticate via query parameter (for SSE connections)
 * EventSource doesn't support custom headers, so we use query params
 */
function authenticateSSE(req: express.Request, res: express.Response, next: express.NextFunction) {
  try {
    const token = req.query.token as string;

    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const secret = process.env.JWT_SECRET || 'your-secret-key';
    const decoded = jwt.verify(token, secret) as { userId: string };

    (req as any).user = { userId: decoded.userId };
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// All routes require authentication via query params
router.use(authenticateSSE);

/**
 * GET /api/sse/polls/:pollId - Subscribe to poll updates
 * Returns real-time updates when votes are cast
 */
router.get('/polls/:pollId', (req, res) => {
  const { pollId } = req.params;
  const userId = (req as any).user.userId;
  const clientId = `${userId}-${randomUUID()}`;

  console.log(`[SSE] Client ${userId} subscribing to poll ${pollId}`);

  // Add client to SSE manager
  sseManager.addClient(clientId, res, pollId);

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch (error) {
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(clientId);
  });
});

/**
 * GET /api/sse/polls - Subscribe to all poll updates
 * Returns real-time updates for any poll
 */
router.get('/polls', (req, res) => {
  const userId = (req as any).user.userId;
  const clientId = `${userId}-${randomUUID()}`;

  console.log(`[SSE] Client ${userId} subscribing to all polls`);

  // Add client to SSE manager (no specific pollId)
  sseManager.addClient(clientId, res);

  // Keep connection alive with periodic heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch (error) {
      clearInterval(heartbeat);
    }
  }, 30000); // Every 30 seconds

  // Clean up on disconnect
  req.on('close', () => {
    clearInterval(heartbeat);
    sseManager.removeClient(clientId);
  });
});

export default router;
