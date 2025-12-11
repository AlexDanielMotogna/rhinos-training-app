import express from 'express';
import { authenticate, requireCoach } from '../middleware/auth.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

/**
 * GET /api/reports/weekly-overview/:startDate?
 * Simple weekly training overview for coaches
 * Returns: players with their training days (self/team) for the week
 */
router.get('/weekly-overview/:startDate?', authenticate, requireCoach, async (req, res) => {
  try {
    const user = (req as any).user;

    // Get coach's categories for filtering
    const coach = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { coachCategories: true },
    });
    const categoryFilter = coach?.coachCategories || [];

    // Calculate week start (Monday)
    let weekStart: Date;
    if (req.params.startDate) {
      weekStart = new Date(req.params.startDate);
      if (isNaN(weekStart.getTime())) {
        return res.status(400).json({ error: 'Invalid date format. Use YYYY-MM-DD' });
      }
    } else {
      const today = new Date();
      const dayOfWeek = today.getDay();
      const diff = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
      weekStart = new Date(today);
      weekStart.setDate(today.getDate() + diff);
    }
    weekStart.setHours(0, 0, 0, 0);

    // Calculate week end (Sunday)
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);

    // Format dates for query
    const startStr = weekStart.toISOString().split('T')[0];
    const endStr = weekEnd.toISOString().split('T')[0];

    // Get players in coach's categories
    const playersWhere: any = { role: 'player' };
    if (categoryFilter.length > 0) {
      playersWhere.ageCategory = { in: categoryFilter };
    }

    const players = await prisma.user.findMany({
      where: playersWhere,
      select: { id: true, name: true, position: true, ageCategory: true },
      orderBy: { name: 'asc' },
    });

    // Get workouts for all these players in the week
    const playerIds = players.map(p => p.id);
    const workouts = await prisma.workoutLog.findMany({
      where: {
        userId: { in: playerIds },
        date: { gte: startStr, lte: endStr },
      },
      select: {
        userId: true,
        date: true,
        source: true,
      },
    });

    // Get team sessions in this week
    const teamSessions = await prisma.trainingSession.findMany({
      where: {
        date: { gte: startStr, lte: endStr },
        sessionCategory: 'team',
      },
      select: { date: true },
    });
    const teamSessionDates = new Set(teamSessions.map(s => s.date));

    // Build player data with daily breakdown
    const weekDays = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      weekDays.push(d.toISOString().split('T')[0]);
    }

    const playerData = players.map(player => {
      const playerWorkouts = workouts.filter(w => w.userId === player.id);

      // Map each day to training status
      const days: Record<string, 'self' | 'team' | null> = {};
      let totalDays = 0;

      weekDays.forEach(day => {
        const dayWorkouts = playerWorkouts.filter(w => w.date === day);

        // Only mark as 'team' if explicitly from team session source
        const hasTeamSession = dayWorkouts.some(w => w.source === 'team');

        // Mark as 'self' for player self-training or coach plan workouts
        const hasSelfTraining = dayWorkouts.some(w => w.source === 'player' || w.source === 'coach');

        if (hasTeamSession) {
          days[day] = 'team';
          totalDays++;
        } else if (hasSelfTraining) {
          days[day] = 'self';
          totalDays++;
        } else {
          days[day] = null;
        }
      });

      return {
        id: player.id,
        name: player.name,
        position: player.position || '-',
        ageCategory: player.ageCategory,
        days,
        totalDays,
      };
    });

    // Count summary
    const playersWhoTrained = playerData.filter(p => p.totalDays > 0).length;

    console.log(`[REPORTS] Weekly overview ${startStr} to ${endStr}: ${playersWhoTrained}/${players.length} players trained`);

    res.json({
      weekStart: startStr,
      weekEnd: endStr,
      weekDays,
      players: playerData,
      summary: {
        totalPlayers: players.length,
        playersTrained: playersWhoTrained,
      },
      availableCategories: categoryFilter,
    });
  } catch (error) {
    console.error('[REPORTS] Weekly overview error:', error);
    res.status(500).json({ error: 'Failed to generate weekly overview' });
  }
});

export default router;
