import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const workoutLogSchema = z.object({
  date: z.string(), // ISO date
  entries: z.array(z.any()), // Array of WorkoutEntry (validated on frontend)
  notes: z.string().optional().nullable(),
  source: z.enum(['coach', 'player']),
  planTemplateId: z.string().optional().nullable(),
  planName: z.string().optional().nullable(),
  duration: z.number().optional().nullable(),
  planMetadata: z.any().optional().nullable(),
  completionPercentage: z.number().optional().nullable(),
});

const workoutReportSchema = z.object({
  workoutTitle: z.string(),
  duration: z.number(),
  source: z.enum(['coach', 'player']),
  intensityScore: z.number().default(0),
  workCapacityScore: z.number().default(0),
  athleticQualityScore: z.number().default(0),
  positionRelevanceScore: z.number().default(0),
  recoveryDemand: z.enum(['low', 'medium', 'high', 'insufficient']).default('medium'),
  sessionValid: z.boolean().optional().default(true),
  keyInsights: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  personalObservations: z.string().optional().nullable(),
  aiGenerated: z.boolean().optional().default(false),
  workoutEntries: z.array(z.any()).default([]),
});

// ========================================
// WORKOUT LOGS
// ========================================

// GET /api/workouts - Get workout logs (filtered by user role)
router.get('/', authenticate, async (req, res) => {
  try {
    const { userId, startDate, endDate } = req.query;

    const where: any = {};

    // If player, only show their workouts
    if (req.user.role === 'player') {
      where.userId = req.user.userId;
    } else {
      // If coach, can filter by userId
      if (userId) {
        where.userId = userId;
      }
    }

    // Date range filter
    if (startDate && endDate) {
      where.date = {
        gte: startDate,
        lte: endDate,
      };
    } else if (startDate) {
      where.date = {
        gte: startDate,
      };
    } else if (endDate) {
      where.date = {
        lte: endDate,
      };
    }

    const workouts = await prisma.workoutLog.findMany({
      where,
      orderBy: [
        { date: 'desc' },
        { syncedAt: 'desc' },
      ],
    });

    res.json(workouts);
  } catch (error) {
    console.error('Get workouts error:', error);
    res.status(500).json({ error: 'Failed to fetch workouts' });
  }
});

// GET /api/workouts/:id - Get single workout
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const workout = await prisma.workoutLog.findUnique({
      where: { id },
    });

    if (!workout) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Players can only view their own workouts
    if (req.user.role === 'player' && workout.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(workout);
  } catch (error) {
    console.error('Get workout error:', error);
    res.status(500).json({ error: 'Failed to fetch workout' });
  }
});

// POST /api/workouts - Create new workout log
router.post('/', authenticate, async (req, res) => {
  try {
    const data = workoutLogSchema.parse(req.body);

    // Get user info
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      select: { name: true },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const workout = await prisma.workoutLog.create({
      data: {
        ...data,
        userId: req.user.userId,
        userName: user.name,
        createdAt: new Date().toISOString(),
      },
    });

    res.status(201).json(workout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create workout error:', error);
    res.status(500).json({ error: 'Failed to create workout' });
  }
});

// PATCH /api/workouts/:id - Update workout log
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = workoutLogSchema.partial().parse(req.body);

    // Check if workout exists
    const existing = await prisma.workoutLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Players can only update their own workouts
    if (req.user.role === 'player' && existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const workout = await prisma.workoutLog.update({
      where: { id },
      data,
    });

    res.json(workout);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update workout error:', error);
    res.status(500).json({ error: 'Failed to update workout' });
  }
});

// DELETE /api/workouts/:id - Delete workout log
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if workout exists
    const existing = await prisma.workoutLog.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Workout not found' });
    }

    // Players can only delete their own workouts
    if (req.user.role === 'player' && existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.workoutLog.delete({
      where: { id },
    });

    res.json({ message: 'Workout deleted successfully' });
  } catch (error) {
    console.error('Delete workout error:', error);
    res.status(500).json({ error: 'Failed to delete workout' });
  }
});

// ========================================
// WORKOUT REPORTS
// ========================================

// GET /api/workouts/reports - Get workout reports
router.get('/reports', authenticate, async (req, res) => {
  try {
    const { userId, source } = req.query;

    const where: any = {};

    // If player, only show their reports
    if (req.user.role === 'player') {
      where.userId = req.user.userId;
    } else {
      // If coach, can filter by userId
      if (userId) {
        where.userId = userId as string;
      }
    }

    if (source) {
      where.source = source as string;
    }

    const reports = await prisma.workoutReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    res.json(reports);
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// POST /api/workouts/reports - Create workout report
router.post('/reports', authenticate, async (req, res) => {
  try {
    console.log('📊 Received report data:', JSON.stringify(req.body, null, 2));
    const data = workoutReportSchema.parse(req.body);

    const report = await prisma.workoutReport.create({
      data: {
        ...data,
        userId: req.user.userId,
        sessionValid: data.sessionValid !== false,
        createdAt: new Date().toISOString(),
      },
    });

    console.log('✅ Report saved to DB:', report.id);
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('❌ Validation error:', error.errors);
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create report error:', error);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// DELETE /api/workouts/reports/:id - Delete workout report
router.delete('/reports/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if report exists
    const existing = await prisma.workoutReport.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Report not found' });
    }

    // Players can only delete their own reports
    if (req.user.role === 'player' && existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.workoutReport.delete({
      where: { id },
    });

    res.json({ message: 'Report deleted successfully' });
  } catch (error) {
    console.error('Delete report error:', error);
    res.status(500).json({ error: 'Failed to delete report' });
  }
});

export default router;
