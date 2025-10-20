import type {
  PointsConfig,
  PointCategory,
  PlayerWeeklyPoints,
  PointsBreakdown,
  PlayerPointsProgress,
  PointCategoryType,
} from '../types/pointsSystem';

/**
 * Default Points Configuration based on Rhinos Offseason System
 */
const DEFAULT_POINTS_CONFIG: PointsConfig = {
  weeklyTarget: 20,
  categories: [
    {
      id: '1',
      type: 'light',
      nameEN: 'Light Sessions',
      nameDE: 'Leichte Einheiten',
      descriptionEN: 'Gentle mobility or low-intensity activities',
      descriptionDE: 'Sanfte Mobilit\u00e4t oder niedrige Intensit\u00e4t',
      points: 1,
      examplesEN: ['Walking \u226530min', 'Yoga/Mobility \u226520min', 'Light Cycling <30min'],
      examplesDE: ['Spazieren \u226530min', 'Yoga/Mobilit\u00e4t \u226520min', 'Leichtes Radfahren <30min'],
      active: true,
      color: '#90CAF9', // Light blue
      minDuration: 20,
    },
    {
      id: '2',
      type: 'moderate',
      nameEN: 'Moderate Sessions',
      nameDE: 'Moderate Einheiten',
      descriptionEN: 'Medium intensity activities',
      descriptionDE: 'Aktivit\u00e4ten mittlerer Intensit\u00e4t',
      points: 2,
      examplesEN: ['Jogging \u226520min', 'Swimming', 'Gym strength <90min', 'Core training'],
      examplesDE: ['Joggen \u226520min', 'Schwimmen', 'Krafttraining <90min', 'Core-Training'],
      active: true,
      color: '#FFB74D', // Orange
      minDuration: 20,
    },
    {
      id: '3',
      type: 'team',
      nameEN: 'Team Training',
      nameDE: 'Teamtraining',
      descriptionEN: 'Official team practice sessions',
      descriptionDE: 'Offizielle Team-Trainingseinheiten',
      points: 2.5,
      examplesEN: ['Team practice', 'Team drills', 'Scrimmage'],
      examplesDE: ['Teamtraining', 'Team-\u00dcbungen', 'Trainingsspiel'],
      active: true,
      color: '#66BB6A', // Green
    },
    {
      id: '4',
      type: 'intensive',
      nameEN: 'Intensive Sessions',
      nameDE: 'Intensive Einheiten',
      descriptionEN: 'Long and demanding training',
      descriptionDE: 'Lange und anspruchsvolle Einheiten',
      points: 3,
      examplesEN: ['Long run/bike/swim \u226560min', 'Strength training >90min', 'Mountain hiking'],
      examplesDE: ['Ausdauer \u226560min', 'Krafttraining >90min', 'Bergwandern'],
      active: true,
      color: '#EF5350', // Red
      minDuration: 60,
    },
  ],
  maxDailyPoints: 3,
  colorScale: {
    low: '#ef5350',      // Red - below 50%
    medium: '#ffa726',   // Orange - 50-80%
    high: '#66bb6a',     // Green - above 80%
  },
};

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
 * Get points configuration from localStorage
 */
export function getPointsConfig(): PointsConfig {
  const stored = localStorage.getItem('pointsConfig');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing points config:', e);
    }
  }
  return DEFAULT_POINTS_CONFIG;
}

/**
 * Update points configuration (admin only)
 */
export function updatePointsConfig(config: PointsConfig, updatedBy: string): PointsConfig {
  const updated: PointsConfig = {
    ...config,
    updatedAt: new Date().toISOString(),
    updatedBy,
  };
  localStorage.setItem('pointsConfig', JSON.stringify(updated));
  return updated;
}

/**
 * Get all active point categories
 */
export function getActiveCategories(): PointCategory[] {
  const config = getPointsConfig();
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
export function calculateWorkoutPoints(
  duration: number,
  source: 'team' | 'coach' | 'personal',
  totalSets: number,
  totalVolume: number,
  totalDistance?: number,
): { categoryType: PointCategoryType; points: number } {
  const config = getPointsConfig();
  const categoryType = determinePointCategory(duration, source, totalSets, totalVolume, totalDistance);

  const category = config.categories.find(c => c.type === categoryType);
  const points = category?.points || 1;

  return { categoryType, points };
}

/**
 * Add workout points to player's weekly total
 */
export function addWorkoutPoints(
  userId: string,
  workoutTitle: string,
  duration: number,
  source: 'team' | 'coach' | 'personal',
  totalSets: number,
  totalVolume: number,
  totalDistance?: number,
  notes?: string,
): PlayerWeeklyPoints {
  const config = getPointsConfig();
  const currentWeek = getISOWeek(new Date()); // "2025-W03"
  const today = new Date().toISOString().slice(0, 10); // "2025-01-19"

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

  // Save to localStorage
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

  // Return empty structure
  const config = getPointsConfig();
  return {
    userId,
    week,
    totalPoints: 0,
    targetPoints: config.weeklyTarget,
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
export function getAllPlayersProgress(week: string): PlayerPointsProgress[] {
  // Get all users from localStorage
  const usersStr = localStorage.getItem('users');
  if (!usersStr) return [];

  try {
    const users = JSON.parse(usersStr);
    const config = getPointsConfig();

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
export function getPlayerProgress(userId: string): PlayerPointsProgress | null {
  const currentWeek = getISOWeek(new Date());
  const allProgress = getAllPlayersProgress(currentWeek);
  return allProgress.find(p => p.userId === userId) || null;
}

/**
 * Reset points configuration to default (admin only)
 */
export function resetPointsConfig(): PointsConfig {
  localStorage.setItem('pointsConfig', JSON.stringify(DEFAULT_POINTS_CONFIG));
  return DEFAULT_POINTS_CONFIG;
}
