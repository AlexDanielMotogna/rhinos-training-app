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
  date: z.string().optional(), // ISO date string (YYYY-MM-DD), backend will generate if not provided
  duration: z.number(),
  source: z.enum(['coach', 'player']),
  intensityScore: z.number().default(0),
  workCapacityScore: z.number().default(0),
  athleticQualityScore: z.number().default(0),
  positionRelevanceScore: z.number().default(0),

  // Breakdown
  totalVolume: z.number().default(0),
  totalDistance: z.number().optional().nullable(),
  avgRPE: z.number().default(5),
  setsCompleted: z.number().default(0),
  setsPlanned: z.number().default(0),

  // Athletic focus
  powerWork: z.number().default(0),
  strengthWork: z.number().default(0),
  speedWork: z.number().default(0),

  // Highlights
  strengths: z.array(z.string()).default([]),
  warnings: z.array(z.string()).default([]),

  // Progress comparison
  volumeChange: z.number().optional().nullable(),
  intensityChange: z.number().optional().nullable(),

  // Recovery
  recoveryDemand: z.enum(['low', 'medium', 'high', 'very-high', 'insufficient']).default('medium'),
  recommendedRestHours: z.number().default(24),
  sessionValid: z.boolean().optional().default(true),

  // AI Insights
  coachInsights: z.string().default(''),
  keyInsights: z.array(z.string()).default([]),
  recommendations: z.array(z.string()).default([]),
  personalObservations: z.string().optional().nullable(),
  aiGenerated: z.boolean().optional().default(false),
  workoutEntries: z.array(z.any()).default([]),

  // Timestamps (optional in request, backend will set if not provided)
  createdAt: z.string().optional(),
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

    console.log('[BACKEND] GET /workouts/reports - User:', req.user.userId, 'Role:', req.user.role);
    console.log('[BACKEND] Query params - userId:', userId, 'source:', source);

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

    console.log('[BACKEND] Query where:', JSON.stringify(where));

    const reports = await prisma.workoutReport.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    console.log('[BACKEND] Found reports:', reports.length);
    console.log('[BACKEND] Sample report:', reports[0] ? {
      id: reports[0].id,
      workoutTitle: reports[0].workoutTitle,
      date: reports[0].date,
      hasDate: !!reports[0].date,
      hasWorkoutEntries: !!reports[0].workoutEntries,
      source: reports[0].source,
      createdAt: reports[0].createdAt
    } : 'none');

    res.json(reports);
  } catch (error) {
    console.error('[BACKEND ERROR] Get reports error:', error);
    console.error('[BACKEND ERROR] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    res.status(500).json({
      error: 'Failed to fetch reports',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

// POST /api/workouts/reports - Create workout report
router.post('/reports', authenticate, async (req, res) => {
  try {
    console.log('📊 Received report data:', JSON.stringify(req.body, null, 2));
    const data = workoutReportSchema.parse(req.body);

    const now = new Date();
    const report = await prisma.workoutReport.create({
      data: {
        ...data,
        userId: req.user.userId,
        date: data.date || now.toISOString().split('T')[0], // Generate date if not provided
        sessionValid: data.sessionValid !== false,
        createdAt: data.createdAt || now.toISOString(), // Use provided createdAt or generate new
      },
    });

    console.log('[WORKOUT] Report saved to DB:', report.id);
    res.status(201).json(report);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.error('[VALIDATION ERROR] Validation error:', error.errors);
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

// ========================================
// USER PLANS (Player-Created Workout Plans)
// ========================================

const userPlanSchema = z.object({
  name: z.string(),
  trainingType: z.string(),
  exercises: z.array(z.any()), // Array of PlanExercise
  notes: z.string().optional().nullable(),
  timesCompleted: z.number().default(0),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

// GET /api/workouts/plans - Get user plans
router.get('/plans', authenticate, async (req, res) => {
  try {
    console.log('[BACKEND] GET /workouts/plans - User:', req.user.userId);

    const plans = await prisma.userPlan.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: 'desc' },
    });

    console.log('[BACKEND] Found user plans:', plans.length);
    res.json(plans);
  } catch (error) {
    console.error('[BACKEND ERROR] Get user plans error:', error);
    console.error('[BACKEND ERROR] Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });

    // If table doesn't exist yet, return empty array
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('does not exist') || errorMessage.includes('UserPlan')) {
      console.warn('[BACKEND WARNING] UserPlan table may not exist yet, returning empty array');
      return res.json([]);
    }

    res.status(500).json({
      error: 'Failed to fetch user plans',
      details: errorMessage
    });
  }
});

// POST /api/workouts/plans - Create user plan
router.post('/plans', authenticate, async (req, res) => {
  try {
    console.log('[BACKEND] POST /workouts/plans - User:', req.user.userId);
    const data = userPlanSchema.parse(req.body);

    const now = new Date().toISOString();
    const plan = await prisma.userPlan.create({
      data: {
        ...data,
        userId: req.user.userId,
        createdAt: data.createdAt || now,
        updatedAt: data.updatedAt || now,
      },
    });

    console.log('[BACKEND] User plan created:', plan.id);
    res.status(201).json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[BACKEND ERROR] Create user plan error:', error);
    res.status(500).json({ error: 'Failed to create user plan' });
  }
});

// PATCH /api/workouts/plans/:id - Update user plan
router.patch('/plans/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const data = userPlanSchema.partial().parse(req.body);

    // Check if plan exists and belongs to user
    const existing = await prisma.userPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const plan = await prisma.userPlan.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date().toISOString(),
      },
    });

    res.json(plan);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[BACKEND ERROR] Update user plan error:', error);
    res.status(500).json({ error: 'Failed to update user plan' });
  }
});

// DELETE /api/workouts/plans/:id - Delete user plan
router.delete('/plans/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if plan exists and belongs to user
    const existing = await prisma.userPlan.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Plan not found' });
    }

    if (existing.userId !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    await prisma.userPlan.delete({
      where: { id },
    });

    res.json({ message: 'Plan deleted successfully' });
  } catch (error) {
    console.error('[BACKEND ERROR] Delete user plan error:', error);
    res.status(500).json({ error: 'Failed to delete user plan' });
  }
});

export default router;
