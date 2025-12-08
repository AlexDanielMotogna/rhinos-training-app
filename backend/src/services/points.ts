/**
 * Points Calculation Service
 *
 * Fixed point values - no configuration needed.
 * Points are calculated based on workout type and intensity.
 */

// Fixed point values
const POINTS = {
  light: 1,       // Light sessions (yoga, walking, stretching, <30min)
  moderate: 2,    // Moderate sessions (gym, jogging, 30-60min)
  team: 2.5,      // Team training sessions
  intensive: 3,   // Intensive sessions (≥60min or high volume)
} as const;

export type PointsCategory = keyof typeof POINTS;

interface WorkoutData {
  duration?: number;      // minutes
  source: string;         // 'coach' | 'player' | 'team'
  entries?: any[];        // workout entries with set data
}

/**
 * Calculate total volume from workout entries
 */
function calculateTotalVolume(entries: any[]): number {
  if (!entries || !Array.isArray(entries)) return 0;

  let totalVolume = 0;
  for (const entry of entries) {
    if (entry.setData && Array.isArray(entry.setData)) {
      for (const set of entry.setData) {
        const weight = parseFloat(set.weight) || 0;
        const reps = parseInt(set.reps) || 0;
        totalVolume += weight * reps;
      }
    }
  }
  return totalVolume;
}

/**
 * Calculate total sets from workout entries
 */
function calculateTotalSets(entries: any[]): number {
  if (!entries || !Array.isArray(entries)) return 0;

  let totalSets = 0;
  for (const entry of entries) {
    if (entry.setData && Array.isArray(entry.setData)) {
      totalSets += entry.setData.length;
    }
  }
  return totalSets;
}

/**
 * Determine points category based on workout characteristics
 */
export function determineCategory(workout: WorkoutData): PointsCategory {
  const { duration = 0, source, entries = [] } = workout;

  // Team training always gets 'team' category
  if (source === 'team') {
    return 'team';
  }

  const totalVolume = calculateTotalVolume(entries);
  const totalSets = calculateTotalSets(entries);

  // Intensive: Long duration OR high volume
  if (duration >= 60 || totalVolume > 5000) {
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
export function calculatePoints(workout: WorkoutData): { points: number; category: PointsCategory } {
  const category = determineCategory(workout);
  const points = POINTS[category];
  return { points, category };
}

/**
 * Get point value for a category
 */
export function getPointsForCategory(category: PointsCategory): number {
  return POINTS[category];
}
