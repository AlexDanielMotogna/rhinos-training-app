import type { WorkoutEntry } from '../types/workout';
import type { Position } from '../types/exercise';
import { getWorkoutLogsByUser } from './workoutLog';

/**
 * Estimate workout duration based on exercises and sets
 * Used when user logs workout after the fact
 */
export function estimateWorkoutDuration(entries: WorkoutEntry[], warmupMinutes?: number): number {
  if (entries.length === 0) return warmupMinutes || 0;

  const totalSets = entries.reduce((sum, entry) => sum + (entry.setData?.length || 0), 0);
  const uniqueExercises = entries.length;

  // Formula:
  // - Each set takes ~1.5 minutes (including rest)
  // - Each exercise transition adds ~2 minutes (setup, transition)
  // - Minimum 10 minutes for any workout
  const estimatedMinutes = (totalSets * 1.5) + (uniqueExercises * 2);
  const baseEstimate = Math.max(10, Math.round(estimatedMinutes));

  // Add warmup time if provided
  return baseEstimate + (warmupMinutes || 0);
}

export interface WorkoutReport {
  // Session validity
  sessionValid?: boolean;         // false if session doesn't meet minimum effective dose

  // Scores principales (0-100)
  intensityScore: number;
  workCapacityScore: number;
  athleticQualityScore: number;
  positionRelevanceScore: number;

  // Breakdown
  totalVolume: number;            // kg
  totalDistance?: number;         // km (for cardio workouts)
  duration: number;               // minutes
  avgRPE: number;                 // 1-10
  setsCompleted: number;
  setsPlanned: number;

  // Athletic focus (percentages)
  powerWork: number;
  strengthWork: number;
  speedWork: number;

  // Highlights (auto-generated)
  strengths: string[];
  warnings: string[];

  // Progress comparison
  volumeChange: number | null;    // % vs last week
  intensityChange: number | null; // % vs last week

  // Recovery
  recoveryDemand: 'low' | 'medium' | 'high' | 'very-high' | 'insufficient';
  recommendedRestHours: number;

  // AI Insights
  coachInsights: string;
}

/**
 * Analyze a completed workout and generate report
 */
export function analyzeWorkout(
  entries: WorkoutEntry[],
  duration: number,
  userId: string,
  userPosition: Position
): WorkoutReport {
  // Calculate basic metrics
  const totalVolume = calculateTotalVolume(entries);
  const totalDistance = calculateTotalDistance(entries);
  const avgRPE = calculateAvgRPE(entries);
  const setsCompleted = countCompletedSets(entries);
  const setsPlanned = countPlannedSets(entries);

  // Calculate scores
  const intensityScore = calculateIntensityScore(entries, avgRPE);
  const workCapacityScore = calculateWorkCapacityScore(totalVolume, duration, setsCompleted);
  const athleticQualityScore = calculateAthleticQualityScore(entries);
  const positionRelevanceScore = calculatePositionRelevance(entries, userPosition);

  // Athletic focus breakdown
  const { powerWork, strengthWork, speedWork } = calculateAthleticFocus(entries);

  // Progress comparison
  const { volumeChange, intensityChange } = compareWithLastWeek(userId, totalVolume, avgRPE);

  // Recovery demand
  const { recoveryDemand, recommendedRestHours } = calculateRecoveryDemand(
    intensityScore,
    totalVolume,
    duration
  );

  // Generate highlights and insights
  const strengths = generateStrengths(athleticQualityScore, intensityScore, workCapacityScore);
  const warnings = generateWarnings(entries, userId, athleticQualityScore);
  const coachInsights = generateCoachInsights(
    entries,
    athleticQualityScore,
    positionRelevanceScore,
    userPosition,
    volumeChange,
    userId
  );

  return {
    intensityScore,
    workCapacityScore,
    athleticQualityScore,
    positionRelevanceScore,
    totalVolume,
    totalDistance,
    duration,
    avgRPE,
    setsCompleted,
    setsPlanned,
    powerWork,
    strengthWork,
    speedWork,
    strengths,
    warnings,
    volumeChange,
    intensityChange,
    recoveryDemand,
    recommendedRestHours,
    coachInsights,
  };
}

/**
 * Calculate total volume (sets × reps × weight)
 */
function calculateTotalVolume(entries: WorkoutEntry[]): number {
  let volume = 0;

  entries.forEach(entry => {
    if (entry.setData) {
      entry.setData.forEach(set => {
        const reps = set.reps || 1;
        const kg = set.kg || 0;
        volume += reps * kg;
      });
    }
  });

  return Math.round(volume);
}

/**
 * Calculate total distance (in km) for cardio/speed workouts
 */
function calculateTotalDistance(entries: WorkoutEntry[]): number | undefined {
  let distance = 0;
  let hasDistance = false;

  entries.forEach(entry => {
    if (entry.setData) {
      entry.setData.forEach(set => {
        if (set.distance !== undefined && set.distance > 0) {
          distance += set.distance;
          hasDistance = true;
        }
      });
    }
  });

  return hasDistance ? distance : undefined;
}

/**
 * Calculate average RPE
 */
function calculateAvgRPE(entries: WorkoutEntry[]): number {
  const rpes = entries.filter(e => e.rpe !== undefined).map(e => e.rpe!);
  if (rpes.length === 0) return 5;

  return Math.round((rpes.reduce((sum, rpe) => sum + rpe, 0) / rpes.length) * 10) / 10;
}

/**
 * Count completed sets
 */
function countCompletedSets(entries: WorkoutEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.setData?.length || 0), 0);
}

/**
 * Count planned sets
 */
function countPlannedSets(entries: WorkoutEntry[]): number {
  return entries.reduce((sum, entry) => sum + (entry.sets || 0), 0);
}

/**
 * Calculate intensity score (0-100)
 * Based on RPE and actual work done - NO FREE POINTS
 */
function calculateIntensityScore(entries: WorkoutEntry[], avgRPE: number): number {
  let score = 0; // Start from ZERO - earn every point

  // 70% from RPE (main factor for intensity)
  if (avgRPE > 0) {
    // RPE scale: <6 = very low, 6-7 = moderate, 7.5-8.5 = good, >9 = elite
    // Formula: ((RPE - 4) / 6) * 100
    // RPE 4 = 0, RPE 5 = 16, RPE 7 = 50, RPE 8 = 66, RPE 10 = 100
    const rpeScore = Math.max(0, ((avgRPE - 4) / 6) * 100);
    score += rpeScore * 0.7;
  }

  // 30% from work volume (sets completed)
  const completed = countCompletedSets(entries);
  // Need at least 8-10 sets to max this out
  const workScore = Math.min(100, (completed / 10) * 100);
  score += workScore * 0.3;

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate work capacity score (0-100)
 * Based on DURATION first, then volume - NO FREE POINTS
 */
function calculateWorkCapacityScore(volume: number, duration: number, sets: number): number {
  let score = 0; // Start from ZERO

  // 60% from DURATION (most important factor)
  // <10 min = joke, 20-30 min = ok, 45-60 min = good, 75+ = excellent
  if (duration < 10) {
    score += 5; // Barely anything
  } else if (duration < 20) {
    score += 20; // Weak
  } else if (duration < 30) {
    score += 40; // Acceptable
  } else if (duration < 45) {
    score += 60; // Good
  } else if (duration < 60) {
    score += 80; // Very good
  } else {
    score += 100; // Excellent
  }
  const durationScore = Math.min(100, (score / 100) * 100);

  // 30% from volume (total work)
  // 1000kg = 20, 3000kg = 50, 6000kg = 80, 10000kg = 100
  const volumeScore = Math.min(100, (volume / 10000) * 100);

  // 10% from set count (but less important)
  const setScore = Math.min(100, (sets / 15) * 100);

  const finalScore = (durationScore * 0.6) + (volumeScore * 0.3) + (setScore * 0.1);
  return Math.round(Math.max(0, Math.min(100, finalScore)));
}

/**
 * Calculate athletic quality score (0-100)
 * Evaluates if workout is athletic vs bodybuilding - CONTEXT AWARE
 * For recovery/mobility sessions, this score measures comprehensiveness, not intensity
 */
function calculateAthleticQualityScore(entries: WorkoutEntry[]): number {
  let score = 0;

  const categories = entries.map(e => e.category);
  const exerciseNames = entries.map(e => e.name.toLowerCase());

  // Check if this is a single-category session
  const uniqueCategories = new Set(categories);
  const isSingleCategorySession = uniqueCategories.size === 1;
  const primaryCategory = isSingleCategorySession ? categories[0] : null;

  // Handle single-category sessions first (Conditioning, Mobility, Recovery, Technique)
  if (isSingleCategorySession && primaryCategory) {
    switch (primaryCategory) {
      case 'Conditioning': {
        // Conditioning is athletic! Give 65-85 base score
        score += 65;
        const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
        if (totalDistance >= 3) score += 10; // 3+ km
        if (totalDistance >= 5) score += 10; // 5+ km
        return Math.round(Math.max(0, Math.min(100, score)));
      }

      case 'Mobility': {
        // Mobility is important - score based on variety and comprehensiveness
        score += 60; // Higher base - mobility IS athletic
        if (entries.length >= 4) score += 15; // Good variety of mobility exercises
        if (entries.length >= 6) score += 10; // Excellent mobility session
        return Math.round(Math.max(0, Math.min(100, score)));
      }

      case 'Recovery': {
        // Recovery sessions should score based on comprehensiveness and time
        score += 55; // Higher base - recovery IS part of athletic training
        if (entries.length >= 3) score += 15; // Multiple recovery modalities
        if (entries.length >= 4) score += 10; // Comprehensive recovery protocol
        return Math.round(Math.max(0, Math.min(100, score)));
      }

      case 'Technique': {
        // Technique work is valuable but not pure athleticism
        score += 55; // Base score for technique work
        if (entries.length >= 4) score += 10; // Good variety of drills
        return Math.round(Math.max(0, Math.min(100, score)));
      }

      case 'Speed': {
        // Pure speed work is excellent for athletes
        score += 70; // High base for speed
        if (entries.length >= 3) score += 15; // Good volume
        return Math.round(Math.max(0, Math.min(100, score)));
      }

      case 'COD': {
        // Change of direction is excellent for athletes
        score += 65; // High base for agility
        if (entries.length >= 4) score += 15; // Good volume
        return Math.round(Math.max(0, Math.min(100, score)));
      }

      case 'Plyometrics': {
        // Plyometrics are explosive and athletic
        score += 75; // Very high base for plyo work
        if (entries.length >= 3) score += 15; // Good volume
        return Math.round(Math.max(0, Math.min(100, score)));
      }
    }
  }

  // For mixed sessions or primarily strength sessions:

  // Compound movements (good for athletes)
  const compoundCount = categories.filter(c => c === 'Strength').length;
  score += Math.min(50, compoundCount * 15); // 3-4 compounds = 50 points

  // Plyometrics/explosive (excellent for athletes)
  const plyoCount = categories.filter(c => c === 'Plyometrics').length;
  score += Math.min(40, plyoCount * 20); // 2 plyo exercises = 40 points

  // Speed/COD work (great for athletes)
  const speedCount = categories.filter(c => c === 'Speed' || c === 'COD').length;
  score += Math.min(30, speedCount * 15);

  // Mobility work (important but lower priority)
  const mobilityCount = categories.filter(c => c === 'Mobility').length;
  score += Math.min(15, mobilityCount * 8); // 2 mobility exercises = 15 points

  // Technique work (valuable for skill development)
  const techniqueCount = categories.filter(c => c === 'Technique').length;
  score += Math.min(15, techniqueCount * 8); // 2 technique exercises = 15 points

  // Isolation exercises (bodybuilding, not athletic)
  const isolationKeywords = ['curl', 'extension', 'raise', 'fly', 'flye'];
  const isolationCount = exerciseNames.filter(name =>
    isolationKeywords.some(keyword => name.includes(keyword))
  ).length;
  score -= isolationCount * 15; // Heavy penalty for isolation

  // Variety bonus (but don't penalize single-category sessions we already handled)
  if (uniqueCategories.size === 1 && !primaryCategory) {
    score -= 20; // Penalty for no variety (shouldn't happen but safety check)
  }
  if (uniqueCategories.size >= 3) score += 20; // Bonus for good variety

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate position relevance score (0-100)
 * Context-aware: Recovery/Mobility/Conditioning sessions are relevant for ALL positions
 */
function calculatePositionRelevance(entries: WorkoutEntry[], position: Position): number {
  let score = 0;

  const categories = entries.map(e => e.category);
  const exerciseNames = entries.map(e => e.name.toLowerCase());

  // Check if this is a specialized session
  const uniqueCategories = new Set(categories);
  const isSingleCategorySession = uniqueCategories.size === 1;
  const primaryCategory = isSingleCategorySession ? categories[0] : null;

  // Recovery, Mobility, and Conditioning are UNIVERSALLY relevant for all positions
  if (primaryCategory === 'Recovery' || primaryCategory === 'Mobility' || primaryCategory === 'Conditioning') {
    score += 70; // High base score - these are essential for ALL positions
    if (entries.length >= 3) score += 15; // Comprehensive session
    return Math.round(Math.max(0, Math.min(100, score)));
  }

  // Check for key compound lifts (good for all positions)
  const hasSquat = exerciseNames.some(n => n.includes('squat'));
  const hasDeadlift = exerciseNames.some(n => n.includes('deadlift'));
  const hasBench = exerciseNames.some(n => n.includes('bench'));

  if (hasSquat) score += 15; // Squats good for everyone
  if (hasDeadlift) score += 15; // Deadlifts good for everyone
  if (hasBench) score += 10; // Bench good but less critical

  // Position-specific priorities
  if (position === 'RB' || position === 'WR' || position === 'DB') {
    // Skill positions: explosiveness > strength
    const explosiveCount = categories.filter(c =>
      c === 'Plyometrics' || c === 'Speed' || c === 'COD'
    ).length;
    score += Math.min(50, explosiveCount * 15); // Explosive work is CRITICAL

    const strengthCount = categories.filter(c => c === 'Strength').length;
    score += Math.min(30, strengthCount * 10); // Strength still important

  } else if (position === 'OL' || position === 'DL') {
    // Line positions: max strength is KING
    const strengthCount = categories.filter(c => c === 'Strength').length;
    score += Math.min(60, strengthCount * 20); // Strength is CRITICAL

    const conditioningCount = categories.filter(c => c === 'Conditioning').length;
    score += Math.min(30, conditioningCount * 15);

  } else if (position === 'LB' || position === 'TE') {
    // Hybrid positions: need both
    const strengthCount = categories.filter(c => c === 'Strength').length;
    score += Math.min(40, strengthCount * 15);

    const explosiveCount = categories.filter(c =>
      c === 'Plyometrics' || c === 'Speed'
    ).length;
    score += Math.min(40, explosiveCount * 15);
  }

  return Math.round(Math.max(0, Math.min(100, score)));
}

/**
 * Calculate athletic focus breakdown
 */
function calculateAthleticFocus(entries: WorkoutEntry[]): {
  powerWork: number;
  strengthWork: number;
  speedWork: number;
} {
  const total = entries.length;
  if (total === 0) return { powerWork: 0, strengthWork: 0, speedWork: 0 };

  let powerCount = 0;
  let strengthCount = 0;
  let speedCount = 0;

  entries.forEach(entry => {
    if (entry.category === 'Plyometrics') {
      powerCount++;
    } else if (entry.category === 'Strength') {
      strengthCount++;
    } else if (entry.category === 'Speed' || entry.category === 'COD') {
      speedCount++;
    }
  });

  return {
    powerWork: Math.round((powerCount / total) * 100),
    strengthWork: Math.round((strengthCount / total) * 100),
    speedWork: Math.round((speedCount / total) * 100),
  };
}

/**
 * Compare with last week's workouts
 */
function compareWithLastWeek(
  userId: string,
  _currentVolume: number,
  _currentRPE: number
): {
  volumeChange: number | null;
  intensityChange: number | null;
} {
  try {
    const allLogs = getWorkoutLogsByUser(userId, false);
    const now = new Date();
    const lastWeekStart = new Date(now);
    lastWeekStart.setDate(lastWeekStart.getDate() - 14); // 2 weeks ago
    const lastWeekEnd = new Date(now);
    lastWeekEnd.setDate(lastWeekEnd.getDate() - 7); // 1 week ago

    const lastWeekLogs = allLogs.filter(log => {
      const logDate = new Date(log.date);
      return logDate >= lastWeekStart && logDate <= lastWeekEnd;
    });

    if (lastWeekLogs.length === 0) {
      return { volumeChange: null, intensityChange: null };
    }

    // Calculate average volume from last week
    // Note: stored logs don't have volume, would need to calculate
    // For MVP, we'll return null or estimate
    return { volumeChange: null, intensityChange: null };

  } catch (e) {
    return { volumeChange: null, intensityChange: null };
  }
}

/**
 * Calculate recovery demand
 */
function calculateRecoveryDemand(
  intensity: number,
  volume: number,
  duration: number
): {
  recoveryDemand: 'low' | 'medium' | 'high' | 'very-high';
  recommendedRestHours: number;
} {
  // Simple heuristic
  const score = (intensity * 0.4) + (Math.min(100, volume / 100) * 0.4) + (Math.min(100, duration / 90) * 0.2);

  if (score < 40) {
    return { recoveryDemand: 'low', recommendedRestHours: 24 };
  } else if (score < 60) {
    return { recoveryDemand: 'medium', recommendedRestHours: 36 };
  } else if (score < 80) {
    return { recoveryDemand: 'high', recommendedRestHours: 48 };
  } else {
    return { recoveryDemand: 'very-high', recommendedRestHours: 60 };
  }
}

/**
 * Generate strengths based on scores
 */
function generateStrengths(athletic: number, intensity: number, capacity: number): string[] {
  const strengths: string[] = [];

  if (athletic >= 80) strengths.push('report.strength.athleticFocus');
  if (intensity >= 80) strengths.push('report.strength.highIntensity');
  if (capacity >= 75) strengths.push('report.strength.goodCapacity');
  if (athletic >= 70 && intensity >= 70) strengths.push('report.strength.balanced');

  return strengths;
}

/**
 * Generate warnings based on analysis
 */
function generateWarnings(entries: WorkoutEntry[], userId: string, athleticScore: number): string[] {
  const warnings: string[] = [];

  // Check session type
  const categories = entries.map(e => e.category);
  const uniqueCategories = new Set(categories);
  const isSingleCategorySession = uniqueCategories.size === 1;
  const primaryCategory = isSingleCategorySession ? categories[0] : null;

  // Skip warnings for specialized sessions (Conditioning, Mobility, Recovery, Technique, Speed, COD, Plyometrics)
  const specializedCategories = ['Conditioning', 'Mobility', 'Recovery', 'Technique', 'Speed', 'COD', 'Plyometrics'];
  const isSpecializedSession = primaryCategory && specializedCategories.includes(primaryCategory);

  // Low athletic quality (but NOT for specialized sessions)
  if (athleticScore < 50 && !isSpecializedSession) {
    warnings.push('report.warning.lowAthletic');
  }

  // Only upper body (but skip for specialized sessions)
  if (!isSpecializedSession) {
    const hasLowerBody = entries.some(e =>
      e.name.toLowerCase().includes('squat') ||
      e.name.toLowerCase().includes('deadlift') ||
      e.name.toLowerCase().includes('lunge')
    );

    if (!hasLowerBody && entries.length > 3) {
      warnings.push('report.warning.noLowerBody');
    }
  }

  // Check recent workout frequency
  try {
    const recentLogs = getWorkoutLogsByUser(userId, false);
    const last3Days = recentLogs.filter(log => {
      const logDate = new Date(log.date);
      const now = new Date();
      const diffDays = (now.getTime() - logDate.getTime()) / (1000 * 60 * 60 * 24);
      return diffDays <= 3;
    });

    if (last3Days.length >= 3) {
      warnings.push('report.warning.highFrequency');
    }
  } catch (e) {
    // Ignore
  }

  return warnings;
}

/**
 * Generate coach insights (rule-based AI)
 */
function generateCoachInsights(
  entries: WorkoutEntry[],
  athleticScore: number,
  positionScore: number,
  position: Position,
  volumeChange: number | null,
  _userId: string
): string {
  const insights: string[] = [];

  // Check session type
  const categories = entries.map(e => e.category);
  const uniqueCategories = new Set(categories);
  const isSingleCategorySession = uniqueCategories.size === 1;
  const primaryCategory = isSingleCategorySession ? categories[0] : null;

  // Handle single-category sessions with specific feedback
  if (isSingleCategorySession && primaryCategory) {
    switch (primaryCategory) {
      case 'Conditioning': {
        const totalDistance = entries.reduce((sum, e) => sum + (e.distance || 0), 0);
        if (totalDistance >= 5) {
          insights.push('report.insight.goodConditioningWork');
        } else if (totalDistance >= 3) {
          insights.push('report.insight.decentConditioningWork');
        } else {
          insights.push('report.insight.keepBuildingBase');
        }
        insights.push('report.insight.balanceWithStrength');
        break;
      }

      case 'Mobility':
        insights.push('report.insight.mobilityWork');
        insights.push('report.insight.balanceWithPower');
        break;

      case 'Recovery':
        insights.push('report.insight.recoveryWork');
        insights.push('report.insight.essentialForProgress');
        break;

      case 'Technique':
        insights.push('report.insight.techniqueWork');
        insights.push('report.insight.skillDevelopment');
        break;

      case 'Speed':
        insights.push('report.insight.speedWork');
        if (position === 'RB' || position === 'WR' || position === 'DB') {
          insights.push('report.insight.perfectForPosition');
        }
        break;

      case 'COD':
        insights.push('report.insight.agilityWork');
        insights.push('report.insight.gameChangerSkill');
        break;

      case 'Plyometrics':
        insights.push('report.insight.explosiveWork');
        insights.push('report.insight.athleticPower');
        break;

      default:
        // For Strength-only sessions
        if (athleticScore >= 85) {
          insights.push('report.insight.excellentAthletic');
        } else if (athleticScore >= 70) {
          insights.push('report.insight.goodAthletic');
        } else if (athleticScore < 50) {
          insights.push('report.insight.improveAthletic');
        }
    }
  } else {
    // For mixed sessions, use original feedback:

    // Athletic quality feedback
    if (athleticScore >= 85) {
      insights.push('report.insight.excellentAthletic');
    } else if (athleticScore >= 70) {
      insights.push('report.insight.goodAthletic');
    } else if (athleticScore < 50) {
      insights.push('report.insight.improveAthletic');
    }

    // Position-specific feedback
    if (positionScore >= 80) {
      insights.push('report.insight.positionGood');
    } else if (positionScore < 60) {
      if (position === 'RB' || position === 'WR' || position === 'DB') {
        insights.push('report.insight.needExplosive');
      } else if (position === 'OL' || position === 'DL') {
        insights.push('report.insight.needStrength');
      }
    }

    // Volume feedback
    if (volumeChange !== null && volumeChange > 25) {
      insights.push('report.insight.volumeJump');
    }
  }

  // Default if no specific insights
  if (insights.length === 0) {
    insights.push('report.insight.keepGoing');
  }

  // Return first 2-3 insights joined
  return insights.slice(0, 3).join(' ');
}
