import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schema for sync request
const syncWeeklyPointsSchema = z.object({
  week: z.string().regex(/^\d{4}-W\d{2}$/, 'Week must be in format YYYY-Www'),
  totalPoints: z.number().min(0),
  targetPoints: z.number().int().min(0),
  workoutDays: z.number().int().min(0).max(7),
  teamTrainingDays: z.number().int().min(0).max(7),
  coachWorkoutDays: z.number().int().min(0).max(7),
  personalWorkoutDays: z.number().int().min(0).max(7),
  breakdown: z.array(z.object({
    date: z.string(),
    workoutTitle: z.string(),
    category: z.string(),
    points: z.number(),
    source: z.string(),
    duration: z.number().optional(),
    totalSets: z.number().optional(),
    totalVolume: z.number().optional(),
    totalDistance: z.number().optional(),
  })),
});

// ========================================
// GET /api/leaderboard - Get current week leaderboard
// ========================================
router.get('/', async (req, res) => {
  try {
    // Get current ISO week (format: "2025-W03")
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const days = Math.floor((now.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    const weekNumber = Math.ceil((days + startOfYear.getDay() + 1) / 7);
    const currentWeek = `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;

    // Get all players' points for current week
    const weeklyPoints = await prisma.playerWeeklyPoints.findMany({
      where: { week: currentWeek },
      orderBy: { totalPoints: 'desc' },
    });

    // Get user info for each player
    const userIds = weeklyPoints.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        position: true,
      },
    });

    // Build leaderboard with user info
    const leaderboard = weeklyPoints.map((points, index) => {
      const user = users.find(u => u.id === points.userId);

      // Calculate metrics
      const compliancePct = points.targetPoints > 0
        ? Math.round((points.totalPoints / points.targetPoints) * 100)
        : 0;

      const attendancePct = points.workoutDays > 0
        ? Math.round((points.workoutDays / 7) * 100)
        : 0;

      const freeSharePct = points.workoutDays > 0
        ? Math.round((points.personalWorkoutDays / points.workoutDays) * 100)
        : 0;

      return {
        rank: index + 1,
        userId: points.userId,
        playerName: user?.name || 'Unknown',
        position: user?.position || 'N/A',
        totalPoints: points.totalPoints,
        targetPoints: points.targetPoints,
        workoutDays: points.workoutDays,
        compliancePct,
        attendancePct,
        freeSharePct,
        teamTrainingDays: points.teamTrainingDays,
        coachWorkoutDays: points.coachWorkoutDays,
        personalWorkoutDays: points.personalWorkoutDays,
        lastUpdated: points.lastUpdated,
      };
    });

    console.log(`[LEADERBOARD] Fetched leaderboard for week ${currentWeek}: ${leaderboard.length} players`);
    res.json({ week: currentWeek, leaderboard });
  } catch (error) {
    console.error('[LEADERBOARD] Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ========================================
// GET /api/leaderboard/:week - Get specific week leaderboard
// ========================================
router.get('/:week', async (req, res) => {
  try {
    const { week } = req.params;

    // Validate week format
    if (!/^\d{4}-W\d{2}$/.test(week)) {
      return res.status(400).json({ error: 'Week must be in format YYYY-Www' });
    }

    // Get all players' points for specified week
    const weeklyPoints = await prisma.playerWeeklyPoints.findMany({
      where: { week },
      orderBy: { totalPoints: 'desc' },
    });

    // Get user info for each player
    const userIds = weeklyPoints.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        position: true,
      },
    });

    // Build leaderboard with user info
    const leaderboard = weeklyPoints.map((points, index) => {
      const user = users.find(u => u.id === points.userId);

      // Calculate metrics
      const compliancePct = points.targetPoints > 0
        ? Math.round((points.totalPoints / points.targetPoints) * 100)
        : 0;

      const attendancePct = points.workoutDays > 0
        ? Math.round((points.workoutDays / 7) * 100)
        : 0;

      const freeSharePct = points.workoutDays > 0
        ? Math.round((points.personalWorkoutDays / points.workoutDays) * 100)
        : 0;

      return {
        rank: index + 1,
        userId: points.userId,
        playerName: user?.name || 'Unknown',
        position: user?.position || 'N/A',
        totalPoints: points.totalPoints,
        targetPoints: points.targetPoints,
        workoutDays: points.workoutDays,
        compliancePct,
        attendancePct,
        freeSharePct,
        teamTrainingDays: points.teamTrainingDays,
        coachWorkoutDays: points.coachWorkoutDays,
        personalWorkoutDays: points.personalWorkoutDays,
        lastUpdated: points.lastUpdated,
      };
    });

    console.log(`[LEADERBOARD] Fetched leaderboard for week ${week}: ${leaderboard.length} players`);
    res.json({ week, leaderboard });
  } catch (error) {
    console.error('[LEADERBOARD] Get leaderboard for week error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ========================================
// GET /api/leaderboard/player/:userId - Get player's weekly history
// ========================================
router.get('/player/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    // Get all weeks for this player, sorted by most recent first
    const weeklyPoints = await prisma.playerWeeklyPoints.findMany({
      where: { userId },
      orderBy: { week: 'desc' },
    });

    console.log(`[LEADERBOARD] Fetched player history for ${userId}: ${weeklyPoints.length} weeks`);
    res.json({ userId, history: weeklyPoints });
  } catch (error) {
    console.error('[LEADERBOARD] Get player history error:', error);
    res.status(500).json({ error: 'Failed to fetch player history' });
  }
});

// ========================================
// POST /api/leaderboard/sync - Sync player's weekly points
// ========================================
router.post('/sync', async (req, res) => {
  try {
    const user = (req as any).user;
    const data = syncWeeklyPointsSchema.parse(req.body);

    // Upsert player weekly points (create or update)
    const weeklyPoints = await prisma.playerWeeklyPoints.upsert({
      where: {
        userId_week: {
          userId: user.userId,
          week: data.week,
        },
      },
      update: {
        totalPoints: data.totalPoints,
        targetPoints: data.targetPoints,
        workoutDays: data.workoutDays,
        teamTrainingDays: data.teamTrainingDays,
        coachWorkoutDays: data.coachWorkoutDays,
        personalWorkoutDays: data.personalWorkoutDays,
        breakdown: data.breakdown,
        lastUpdated: new Date(),
      },
      create: {
        userId: user.userId,
        week: data.week,
        totalPoints: data.totalPoints,
        targetPoints: data.targetPoints,
        workoutDays: data.workoutDays,
        teamTrainingDays: data.teamTrainingDays,
        coachWorkoutDays: data.coachWorkoutDays,
        personalWorkoutDays: data.personalWorkoutDays,
        breakdown: data.breakdown,
      },
    });

    console.log(`[LEADERBOARD] Synced points for ${user.email}, week ${data.week}: ${data.totalPoints} points`);
    res.json(weeklyPoints);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[LEADERBOARD] Sync points error:', error);
    res.status(500).json({ error: 'Failed to sync points' });
  }
});

export default router;
