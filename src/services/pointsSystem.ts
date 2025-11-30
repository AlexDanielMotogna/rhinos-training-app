import type {
  PlayerWeeklyPoints,
  PointsBreakdown,
  PointCategoryType,
  PlayerPointsProgress,
} from '../types/pointsSystem';
import { leaderboardService } from './api';

/**
 * Fixed Points Configuration
 * Simple and consistent point values for all teams
 */
const POINTS_CONFIG = {
  // Points per workout type
  light: 1,       // Light sessions (yoga, walking, stretching)
  moderate: 2,    // Moderate sessions (gym, jogging)
  team: 2.5,      // Team training sessions
  intensive: 3,   // Intensive sessions (>90min or high volume)

  // Limits
  maxDailyPoints: 3,  // Max points per day
  weeklyTarget: 20,   // Target points per week
} as const;

/**
 * Get ISO week string for a given date
 * Returns format: "2025-W03"
 */
function getISOWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
}

/**
 * Determine point category based on workout characteristics
 * This is the automatic classification logic
 */
export function determinePointCategory(
  duration: number, // minutes
  source: 'team' | 'coach' | 'personal',
  totalSets: number,
  totalVolume: number, // kg
  totalDistance?: number, // km
): PointCategoryType {
  // Team training always gets 'team' category
  if (source === 'team') {
    return 'team';
  }

  // Intensive: Long duration OR high volume
  if (duration >= 90 || totalVolume > 5000 || (totalDistance && totalDistance >= 5)) {
    return 'intensive';
  }

  // Moderate: Medium duration with some volume
  if (duration >= 30 || totalSets >= 8 || totalVolume > 1000) {
    return 'moderate';
  }

  // Light: Short duration, low intensity
  return 'light';
}

/**
 * Calculate points for a workout using fixed values
 */
export function calculateWorkoutPoints(
  duration: number,
  source: 'team' | 'coach' | 'personal',
  totalSets: number,
  totalVolume: number,
  totalDistance?: number,
): { categoryType: PointCategoryType; points: number } {
  const categoryType = determinePointCategory(duration, source, totalSets, totalVolume, totalDistance);
  const points = POINTS_CONFIG[categoryType];
  return { categoryType, points };
}

/**
 * Add workout points to player's weekly total
 */
export async function addWorkoutPoints(
  userId: string,
  workoutTitle: string,
  duration: number,
  source: 'team' | 'coach' | 'personal',
  totalSets: number,
  totalVolume: number,
  totalDistance?: number,
  notes?: string,
): Promise<PlayerWeeklyPoints> {
  const currentWeek = getISOWeek(new Date());
  const today = new Date().toISOString().slice(0, 10);

  // Get existing points for this week
  const existing = getPlayerWeeklyPoints(userId, currentWeek);

  // Calculate points for this workout
  const { categoryType, points } = calculateWorkoutPoints(
    duration,
    source,
    totalSets,
    totalVolume,
    totalDistance
  );

  // Check if we already have points for this date
  const existingToday = existing.breakdown.filter(b => b.date === today);
  const pointsToday = existingToday.reduce((sum, b) => sum + b.points, 0);

  // Apply daily maximum
  let finalPoints = points;
  if (pointsToday + points > POINTS_CONFIG.maxDailyPoints) {
    finalPoints = Math.max(0, POINTS_CONFIG.maxDailyPoints - pointsToday);
  }

  // Create new breakdown entry
  const newEntry: PointsBreakdown = {
    date: today,
    workoutTitle,
    categoryType,
    points: finalPoints,
    duration,
    source,
    notes,
  };

  // Update weekly points
  const updated: PlayerWeeklyPoints = {
    ...existing,
    totalPoints: existing.totalPoints + finalPoints,
    breakdown: [...existing.breakdown, newEntry],
    lastUpdated: new Date().toISOString(),
  };

  // Update day counts
  const uniqueDates = new Set(updated.breakdown.map(b => b.date));
  updated.workoutDays = uniqueDates.size;
  updated.teamTrainingDays = new Set(
    updated.breakdown.filter(b => b.source === 'team').map(b => b.date)
  ).size;
  updated.coachWorkoutDays = new Set(
    updated.breakdown.filter(b => b.source === 'coach').map(b => b.date)
  ).size;
  updated.personalWorkoutDays = new Set(
    updated.breakdown.filter(b => b.source === 'personal').map(b => b.date)
  ).size;

  // Save to localStorage (weekly points are still stored locally)
  savePlayerWeeklyPoints(userId, currentWeek, updated);

  // Sync to backend if online
  await syncWeeklyPointsToBackend(updated);

  return updated;
}

/**
 * Get player's weekly points
 */
export function getPlayerWeeklyPoints(userId: string, week: string): PlayerWeeklyPoints {
  const key = `weeklyPoints_${userId}_${week}`;
  const stored = localStorage.getItem(key);

  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing weekly points:', e);
    }
  }

  // Return empty structure with fixed target
  return {
    userId,
    week,
    totalPoints: 0,
    targetPoints: POINTS_CONFIG.weeklyTarget,
    workoutDays: 0,
    teamTrainingDays: 0,
    coachWorkoutDays: 0,
    personalWorkoutDays: 0,
    breakdown: [],
    lastUpdated: new Date().toISOString(),
  };
}

/**
 * Save player's weekly points
 */
function savePlayerWeeklyPoints(userId: string, week: string, points: PlayerWeeklyPoints): void {
  const key = `weeklyPoints_${userId}_${week}`;
  localStorage.setItem(key, JSON.stringify(points));
}

/**
 * Sync player's weekly points to backend
 */
async function syncWeeklyPointsToBackend(points: PlayerWeeklyPoints): Promise<void> {
  try {
    // Transform breakdown to match backend schema
    const breakdown = points.breakdown.map(b => ({
      date: b.date,
      workoutTitle: b.workoutTitle,
      category: b.categoryType,
      points: b.points,
      source: b.source,
      duration: b.duration,
      totalSets: undefined, // Not tracked in current breakdown
      totalVolume: undefined, // Not tracked in current breakdown
      totalDistance: undefined, // Not tracked in current breakdown
    }));

    await leaderboardService.syncWeeklyPoints({
      week: points.week,
      totalPoints: points.totalPoints,
      targetPoints: points.targetPoints,
      workoutDays: points.workoutDays,
      teamTrainingDays: points.teamTrainingDays,
      coachWorkoutDays: points.coachWorkoutDays,
      personalWorkoutDays: points.personalWorkoutDays,
      breakdown,
    });

    console.log(`[POINTS] Synced week ${points.week} to backend: ${points.totalPoints} points`);
  } catch (error) {
    console.error('[POINTS] Failed to sync to backend:', error);
  }
}

// Fixed color scale for progress indicators
const COLOR_SCALE = {
  low: '#ef5350',    // Red - below 50%
  medium: '#ffa726', // Orange - 50-80%
  high: '#66bb6a',   // Green - above 80%
};

/**
 * Get all players' progress for a specific week
 */
export function getAllPlayersProgress(week: string): PlayerPointsProgress[] {
  // Get all users from localStorage
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return [];

  try {
    const users = JSON.parse(usersStr);

    const progress: PlayerPointsProgress[] = users
      .filter((u: any) => u.role === 'player')
      .map((user: any) => {
        const weeklyPoints = getPlayerWeeklyPoints(user.id, week);
        const progressPercentage = Math.min(100, (weeklyPoints.totalPoints / weeklyPoints.targetPoints) * 100);

        // Determine color based on progress
        let color = COLOR_SCALE.low;
        if (progressPercentage >= 80) {
          color = COLOR_SCALE.high;
        } else if (progressPercentage >= 50) {
          color = COLOR_SCALE.medium;
        }

        // Get last workout date
        const lastWorkout = weeklyPoints.breakdown.length > 0
          ? weeklyPoints.breakdown[weeklyPoints.breakdown.length - 1].date
          : undefined;

        return {
          userId: user.id,
          userName: user.name,
          position: user.position,
          currentWeek: week,
          totalPoints: weeklyPoints.totalPoints,
          targetPoints: weeklyPoints.targetPoints,
          progressPercentage,
          color,
          rank: 0,
          daysActive: weeklyPoints.workoutDays,
          lastWorkout,
        };
      });

    // Sort by points (descending) and assign ranks
    progress.sort((a, b) => b.totalPoints - a.totalPoints);
    progress.forEach((p, index) => {
      p.rank = index + 1;
    });

    return progress;
  } catch (e) {
    console.error('Error getting all players progress:', e);
    return [];
  }
}

/**
 * Get player's progress for current week
 */
export function getPlayerProgress(userId: string): PlayerPointsProgress | null {
  const currentWeek = getISOWeek(new Date());
  const allProgress = getAllPlayersProgress(currentWeek);
  return allProgress.find(p => p.userId === userId) || null;
}
