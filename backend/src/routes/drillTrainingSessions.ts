import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createSessionSchema = z.object({
  name: z.string().min(1, 'Session name is required'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format'),
  drills: z.array(z.string()).default([]),
  notes: z.string().optional(),
});

const updateSessionSchema = z.object({
  name: z.string().min(1).optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format').optional(),
  drills: z.array(z.string()).optional(),
  notes: z.string().optional(),
});

// GET /api/drill-training-sessions - Get all sessions (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Coaches can see all sessions, players see their own
    const where = user.role === 'coach' ? {} : { createdBy: user.userId };

    const sessions = await prisma.drillTrainingSession.findMany({
      where,
      orderBy: { date: 'desc' },
    });

    res.json(sessions);
  } catch (error) {
    console.error('[DRILL SESSIONS] Get sessions error:', error);
    res.status(500).json({ error: 'Failed to fetch sessions' });
  }
});

// GET /api/drill-training-sessions/:id - Get single session (authenticated)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.drillTrainingSession.findUnique({
      where: { id },
    });

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json(session);
  } catch (error) {
    console.error('[DRILL SESSIONS] Get session error:', error);
    res.status(500).json({ error: 'Failed to fetch session' });
  }
});

// POST /api/drill-training-sessions - Create session (coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can create sessions
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create training sessions' });
    }

    const validatedData = createSessionSchema.parse(req.body);

    const session = await prisma.drillTrainingSession.create({
      data: {
        name: validatedData.name,
        date: validatedData.date,
        drills: validatedData.drills,
        notes: validatedData.notes,
        createdBy: user.userId,
      },
    });

    console.log(`[DRILL SESSIONS] Session created: ${session.name} by ${user.email}`);
    res.status(201).json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[DRILL SESSIONS] Create session error:', error);
    res.status(500).json({ error: 'Failed to create session' });
  }
});

// PUT /api/drill-training-sessions/:id - Update session (coach only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can update sessions
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update training sessions' });
    }

    const validatedData = updateSessionSchema.parse(req.body);

    const session = await prisma.drillTrainingSession.update({
      where: { id },
      data: validatedData,
    });

    console.log(`[DRILL SESSIONS] Session updated: ${session.name} by ${user.email}`);
    res.json(session);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    console.error('[DRILL SESSIONS] Update session error:', error);
    res.status(500).json({ error: 'Failed to update session' });
  }
});

// DELETE /api/drill-training-sessions/:id - Delete session (coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can delete sessions
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete training sessions' });
    }

    await prisma.drillTrainingSession.delete({
      where: { id },
    });

    console.log(`[DRILL SESSIONS] Session deleted by ${user.email}`);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Session not found' });
    }
    console.error('[DRILL SESSIONS] Delete session error:', error);
    res.status(500).json({ error: 'Failed to delete session' });
  }
});

export default router;
