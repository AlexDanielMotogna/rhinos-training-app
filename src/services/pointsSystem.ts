import type {
  PointsConfig,
  PointCategory,
  PlayerWeeklyPoints,
  PointsBreakdown,
  PlayerPointsProgress,
  PointCategoryType,
} from '../types/pointsSystem';
import { pointsConfigService } from './api';

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
 * Get points configuration from backend
 */
export async function getPointsConfig(): Promise<PointsConfig> {
  try {
    return await pointsConfigService.get() as PointsConfig;
  } catch (error) {
    console.error('Error loading points config:', error);
    // Return default if error
    return {
      weeklyTarget: 20,
      maxDailyPoints: 3,
      categories: [],
      colorScale: {
        low: '#ef5350',
        medium: '#ffa726',
        high: '#66bb6a',
      },
    };
  }
}

/**
 * Update points configuration (admin only)
 */
export async function updatePointsConfig(config: PointsConfig, updatedBy: string): Promise<PointsConfig> {
  const updated: PointsConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  return await pointsConfigService.update(updated) as PointsConfig;
}

/**
 * Reset points configuration to default (admin only)
 */
export async function resetPointsConfig(): Promise<void> {
  await pointsConfigService.reset();
}

/**
 * Get all active point categories
 */
export async function getActiveCategories(): Promise<PointCategory[]> {
  const config = await getPointsConfig();
  return config.categories.filter(cat => cat.active);
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
 * Calculate points for a workout
 */
export async function calculateWorkoutPoints(
  duration: number,
  source: 'team' | 'coach' | 'personal',
  totalSets: number,
  totalVolume: number,
  totalDistance?: number,
): Promise<{ categoryType: PointCategoryType; points: number }> {
  const config = await getPointsConfig();
  const categoryType = determinePointCategory(duration, source, totalSets, totalVolume, totalDistance);

  const category = config.categories.find(c => c.type === categoryType);
  const points = category?.points || 1;

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
  const config = await getPointsConfig();
  const currentWeek = getISOWeek(new Date()); // "2025-W03"
  const today = new Date().toISOString().slice(0, 10); // "2025-01-19"

  // Get existing points for this week
  const existing = getPlayerWeeklyPoints(userId, currentWeek);

  // Calculate points for this workout
  const { categoryType, points } = await calculateWorkoutPoints(
    duration,
    source,
    totalSets,
    totalVolume,
    totalDistance
  );

  // Check if we already have points for this date
  const existingToday = existing.breakdown.filter(b => b.date === today);
  const pointsToday = existingToday.reduce((sum, b) => sum + b.points, 0);

  // Apply daily maximum if configured
  let finalPoints = points;
  if (config.maxDailyPoints && pointsToday + points > config.maxDailyPoints) {
    finalPoints = Math.max(0, config.maxDailyPoints - pointsToday);
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

  // Return empty structure with default target
  return {
    userId,
    week,
    totalPoints: 0,
    targetPoints: 20, // Default, should be loaded from backend config
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
 * Get all players' progress for a specific week
 */
export async function getAllPlayersProgress(week: string): Promise<PlayerPointsProgress[]> {
  // Get all users from localStorage
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return [];

  try {
    const users = JSON.parse(usersStr);
    const config = await getPointsConfig();

    const progress: PlayerPointsProgress[] = users
      .filter((u: any) => u.role === 'player')
      .map((user: any) => {
        const weeklyPoints = getPlayerWeeklyPoints(user.id, week);
        const progressPercentage = Math.min(100, (weeklyPoints.totalPoints / weeklyPoints.targetPoints) * 100);

        // Determine color based on progress
        let color = config.colorScale.low;
        if (progressPercentage >= 80) {
          color = config.colorScale.high;
        } else if (progressPercentage >= 50) {
          color = config.colorScale.medium;
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
          rank: 0, // Will be calculated after sorting
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
export async function getPlayerProgress(userId: string): Promise<PlayerPointsProgress | null> {
  const currentWeek = getISOWeek(new Date());
  const allProgress = await getAllPlayersProgress(currentWeek);
  return allProgress.find(p => p.userId === userId) || null;
}
