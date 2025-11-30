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

// Helper function to get all weeks in a month
function getWeeksInMonth(year: number, month: number): string[] {
  const weeks: string[] = [];
  const firstDay = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0);

  // Get week number for a date
  const getWeekNumber = (date: Date): number => {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const days = Math.floor((date.getTime() - startOfYear.getTime()) / (24 * 60 * 60 * 1000));
    return Math.ceil((days + startOfYear.getDay() + 1) / 7);
  };

  const firstWeek = getWeekNumber(firstDay);
  const lastWeek = getWeekNumber(lastDay);

  for (let w = firstWeek; w <= lastWeek; w++) {
    weeks.push(`${year}-W${w.toString().padStart(2, '0')}`);
  }

  return weeks;
}

// ========================================
// GET /api/leaderboard - Get current month leaderboard (filtered by category)
// ========================================
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1; // 1-12
    const currentMonth = `${year}-${month.toString().padStart(2, '0')}`;

    // Get user's category info for filtering
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    });

    // Determine which categories to filter by
    let categoryFilter: string[] = [];
    if (dbUser?.role === 'player' && dbUser?.ageCategory) {
      // Players only see their own category
      categoryFilter = [dbUser.ageCategory];
    } else if (dbUser?.role === 'coach' && dbUser?.coachCategories && dbUser.coachCategories.length > 0) {
      // Coaches see their categories
      categoryFilter = dbUser.coachCategories;
    }
    // If no category filter, show all (superuser behavior)

    // Get all weeks that fall in this month
    const weeksInMonth = getWeeksInMonth(year, month);

    // Get players to include based on category
    let playerIdsToInclude: string[] | null = null;
    if (categoryFilter.length > 0) {
      const playersInCategories = await prisma.user.findMany({
        where: {
          role: 'player',
          ageCategory: { in: categoryFilter },
        },
        select: { id: true },
      });
      playerIdsToInclude = playersInCategories.map(p => p.id);
    }

    // Get all players' points for all weeks in this month
    const weeklyPointsWhere: any = { week: { in: weeksInMonth } };
    if (playerIdsToInclude !== null) {
      weeklyPointsWhere.userId = { in: playerIdsToInclude };
    }

    const weeklyPoints = await prisma.playerWeeklyPoints.findMany({
      where: weeklyPointsWhere,
    });

    // Aggregate points by user for the month
    const userPointsMap = new Map<string, {
      totalPoints: number;
      targetPoints: number;
      workoutDays: number;
      teamTrainingDays: number;
      coachWorkoutDays: number;
      personalWorkoutDays: number;
    }>();

    weeklyPoints.forEach(wp => {
      const existing = userPointsMap.get(wp.userId) || {
        totalPoints: 0,
        targetPoints: 0,
        workoutDays: 0,
        teamTrainingDays: 0,
        coachWorkoutDays: 0,
        personalWorkoutDays: 0,
      };

      userPointsMap.set(wp.userId, {
        totalPoints: existing.totalPoints + wp.totalPoints,
        targetPoints: existing.targetPoints + wp.targetPoints,
        workoutDays: existing.workoutDays + wp.workoutDays,
        teamTrainingDays: existing.teamTrainingDays + wp.teamTrainingDays,
        coachWorkoutDays: existing.coachWorkoutDays + wp.coachWorkoutDays,
        personalWorkoutDays: existing.personalWorkoutDays + wp.personalWorkoutDays,
      });
    });

    // Convert to array and sort by total points
    const aggregatedPoints = Array.from(userPointsMap.entries())
      .map(([userId, points]) => ({ userId, ...points }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Get user info for each player
    const userIds = aggregatedPoints.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        position: true,
        ageCategory: true,
      },
    });

    // Build leaderboard with user info (using aggregated monthly data)
    const leaderboard = aggregatedPoints.map((points, index) => {
      const user = users.find(u => u.id === points.userId);

      // Calculate metrics (for monthly: divide by approximate days in month)
      const daysInMonth = new Date(year, month, 0).getDate();
      const compliancePct = points.targetPoints > 0
        ? Math.round((points.totalPoints / points.targetPoints) * 100)
        : 0;

      const attendancePct = daysInMonth > 0
        ? Math.round((points.workoutDays / daysInMonth) * 100)
        : 0;

      const freeSharePct = points.workoutDays > 0
        ? Math.round((points.personalWorkoutDays / points.workoutDays) * 100)
        : 0;

      return {
        rank: index + 1,
        userId: points.userId,
        playerName: user?.name || 'Unknown',
        position: user?.position || 'N/A',
        ageCategory: user?.ageCategory,
        totalPoints: points.totalPoints,
        targetPoints: points.targetPoints,
        workoutDays: points.workoutDays,
        compliancePct,
        attendancePct,
        freeSharePct,
        teamTrainingDays: points.teamTrainingDays,
        coachWorkoutDays: points.coachWorkoutDays,
        personalWorkoutDays: points.personalWorkoutDays,
      };
    });

    console.log(`[LEADERBOARD] Fetched leaderboard for month ${currentMonth}: ${leaderboard.length} players`);
    res.json({ month: currentMonth, leaderboard });
  } catch (error) {
    console.error('[LEADERBOARD] Get leaderboard error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

// ========================================
// GET /api/leaderboard/month/:month - Get specific month leaderboard (filtered by category)
// ========================================
router.get('/month/:month', async (req, res) => {
  try {
    const user = (req as any).user;
    const { month } = req.params;

    // Validate month format (YYYY-MM)
    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'Month must be in format YYYY-MM' });
    }

    // Get user's category info for filtering
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    });

    // Determine which categories to filter by
    let categoryFilter: string[] = [];
    if (dbUser?.role === 'player' && dbUser?.ageCategory) {
      categoryFilter = [dbUser.ageCategory];
    } else if (dbUser?.role === 'coach' && dbUser?.coachCategories && dbUser.coachCategories.length > 0) {
      categoryFilter = dbUser.coachCategories;
    }

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);

    // Get all weeks that fall in this month
    const weeksInMonth = getWeeksInMonth(year, monthNum);

    // Get players to include based on category
    let playerIdsToInclude: string[] | null = null;
    if (categoryFilter.length > 0) {
      const playersInCategories = await prisma.user.findMany({
        where: {
          role: 'player',
          ageCategory: { in: categoryFilter },
        },
        select: { id: true },
      });
      playerIdsToInclude = playersInCategories.map(p => p.id);
    }

    // Get all players' points for all weeks in this month
    const weeklyPointsWhere: any = { week: { in: weeksInMonth } };
    if (playerIdsToInclude !== null) {
      weeklyPointsWhere.userId = { in: playerIdsToInclude };
    }

    const weeklyPoints = await prisma.playerWeeklyPoints.findMany({
      where: weeklyPointsWhere,
    });

    // Aggregate points by user for the month
    const userPointsMap = new Map<string, {
      totalPoints: number;
      targetPoints: number;
      workoutDays: number;
      teamTrainingDays: number;
      coachWorkoutDays: number;
      personalWorkoutDays: number;
    }>();

    weeklyPoints.forEach(wp => {
      const existing = userPointsMap.get(wp.userId) || {
        totalPoints: 0,
        targetPoints: 0,
        workoutDays: 0,
        teamTrainingDays: 0,
        coachWorkoutDays: 0,
        personalWorkoutDays: 0,
      };

      userPointsMap.set(wp.userId, {
        totalPoints: existing.totalPoints + wp.totalPoints,
        targetPoints: existing.targetPoints + wp.targetPoints,
        workoutDays: existing.workoutDays + wp.workoutDays,
        teamTrainingDays: existing.teamTrainingDays + wp.teamTrainingDays,
        coachWorkoutDays: existing.coachWorkoutDays + wp.coachWorkoutDays,
        personalWorkoutDays: existing.personalWorkoutDays + wp.personalWorkoutDays,
      });
    });

    // Convert to array and sort by total points
    const aggregatedPoints = Array.from(userPointsMap.entries())
      .map(([userId, points]) => ({ userId, ...points }))
      .sort((a, b) => b.totalPoints - a.totalPoints);

    // Get user info for each player
    const userIds = aggregatedPoints.map(p => p.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        position: true,
        ageCategory: true,
      },
    });

    // Build leaderboard with user info
    const daysInMonth = new Date(year, monthNum, 0).getDate();
    const leaderboard = aggregatedPoints.map((points, index) => {
      const user = users.find(u => u.id === points.userId);

      const compliancePct = points.targetPoints > 0
        ? Math.round((points.totalPoints / points.targetPoints) * 100)
        : 0;

      const attendancePct = daysInMonth > 0
        ? Math.round((points.workoutDays / daysInMonth) * 100)
        : 0;

      const freeSharePct = points.workoutDays > 0
        ? Math.round((points.personalWorkoutDays / points.workoutDays) * 100)
        : 0;

      return {
        rank: index + 1,
        userId: points.userId,
        playerName: user?.name || 'Unknown',
        position: user?.position || 'N/A',
        ageCategory: user?.ageCategory,
        totalPoints: points.totalPoints,
        targetPoints: points.targetPoints,
        workoutDays: points.workoutDays,
        compliancePct,
        attendancePct,
        freeSharePct,
        teamTrainingDays: points.teamTrainingDays,
        coachWorkoutDays: points.coachWorkoutDays,
        personalWorkoutDays: points.personalWorkoutDays,
      };
    });

    console.log(`[LEADERBOARD] Fetched leaderboard for month ${month}: ${leaderboard.length} players`);
    res.json({ month, leaderboard });
  } catch (error) {
    console.error('[LEADERBOARD] Get leaderboard for month error:', error);
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
