import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Helper to get start and end dates for a month
function getMonthDateRange(year: number, month: number): { startDate: string; endDate: string } {
  const startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
  const lastDay = new Date(year, month, 0).getDate();
  const endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay}`;
  return { startDate, endDate };
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
    const { startDate, endDate } = getMonthDateRange(year, month);

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

    // Get all workouts for the month (directly from WorkoutLog)
    const workoutsWhere: any = {
      date: { gte: startDate, lte: endDate },
    };
    if (playerIdsToInclude !== null) {
      workoutsWhere.userId = { in: playerIdsToInclude };
    }

    const workouts = await prisma.workoutLog.findMany({
      where: workoutsWhere,
      select: {
        userId: true,
        userName: true,
        date: true,
        points: true,
      },
    });

    // Aggregate points by user
    const userPointsMap = new Map<string, {
      userName: string;
      totalPoints: number;
      workoutDates: Set<string>;
    }>();

    workouts.forEach(workout => {
      const existing = userPointsMap.get(workout.userId) || {
        userName: workout.userName || 'Unknown',
        totalPoints: 0,
        workoutDates: new Set<string>(),
      };

      existing.totalPoints += workout.points || 0;
      existing.workoutDates.add(workout.date);
      userPointsMap.set(workout.userId, existing);
    });

    // Get user info and sort by points
    const userIds = Array.from(userPointsMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, position: true, ageCategory: true },
    });

    // Build and sort leaderboard
    const leaderboard = Array.from(userPointsMap.entries())
      .map(([userId, data]) => {
        const userInfo = users.find(u => u.id === userId);
        return {
          userId,
          playerName: userInfo?.name || data.userName,
          position: userInfo?.position || '-',
          ageCategory: userInfo?.ageCategory,
          totalPoints: data.totalPoints,
          workoutDays: data.workoutDates.size,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

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

    const [yearStr, monthStr] = month.split('-');
    const year = parseInt(yearStr);
    const monthNum = parseInt(monthStr);
    const { startDate, endDate } = getMonthDateRange(year, monthNum);

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

    // Get all workouts for the month (directly from WorkoutLog)
    const workoutsWhere: any = {
      date: { gte: startDate, lte: endDate },
    };
    if (playerIdsToInclude !== null) {
      workoutsWhere.userId = { in: playerIdsToInclude };
    }

    const workouts = await prisma.workoutLog.findMany({
      where: workoutsWhere,
      select: {
        userId: true,
        userName: true,
        date: true,
        points: true,
      },
    });

    // Aggregate points by user
    const userPointsMap = new Map<string, {
      userName: string;
      totalPoints: number;
      workoutDates: Set<string>;
    }>();

    workouts.forEach(workout => {
      const existing = userPointsMap.get(workout.userId) || {
        userName: workout.userName || 'Unknown',
        totalPoints: 0,
        workoutDates: new Set<string>(),
      };

      existing.totalPoints += workout.points || 0;
      existing.workoutDates.add(workout.date);
      userPointsMap.set(workout.userId, existing);
    });

    // Get user info and sort by points
    const userIds = Array.from(userPointsMap.keys());
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, name: true, position: true, ageCategory: true },
    });

    // Build and sort leaderboard
    const leaderboard = Array.from(userPointsMap.entries())
      .map(([userId, data]) => {
        const userInfo = users.find(u => u.id === userId);
        return {
          userId,
          playerName: userInfo?.name || data.userName,
          position: userInfo?.position || '-',
          ageCategory: userInfo?.ageCategory,
          totalPoints: data.totalPoints,
          workoutDays: data.workoutDates.size,
        };
      })
      .sort((a, b) => b.totalPoints - a.totalPoints)
      .map((entry, index) => ({ rank: index + 1, ...entry }));

    console.log(`[LEADERBOARD] Fetched leaderboard for month ${month}: ${leaderboard.length} players`);
    res.json({ month, leaderboard });
  } catch (error) {
    console.error('[LEADERBOARD] Get leaderboard for month error:', error);
    res.status(500).json({ error: 'Failed to fetch leaderboard' });
  }
});

export default router;
