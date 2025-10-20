/**
 * Points System Types for Rhinos Offseason Training
 *
 * Dynamic and configurable point categories for tracking player training activity
 */

export type PointCategoryType =
  | 'light'      // Leichte Einheiten (1 pt)
  | 'moderate'   // Moderate Einheiten (2 pts)
  | 'team'       // Teamtraining (2.5 pts)
  | 'intensive'; // Intensive Einheiten (3 pts)

export interface PointCategory {
  id: string;
  type: PointCategoryType;
  nameEN: string;
  nameDE: string;
  descriptionEN: string;
  descriptionDE: string;
  points: number;
  examplesEN: string[]; // Examples: ["Walking ≥30min", "Yoga ≥20min"]
  examplesDE: string[];
  active: boolean;
  color: string; // Hex color for visual display
  minDuration?: number; // Optional minimum duration in minutes
  maxPoints?: number; // Optional max points per day for this category
}

export interface PlayerWeeklyPoints {
  userId: string;
  week: string; // Format: "2025-W03" (YYYY-Www)
  totalPoints: number;
  targetPoints: number; // Default: 20
  workoutDays: number; // Days with any workout
  teamTrainingDays: number; // Days with team training attendance
  coachWorkoutDays: number; // Days with coach-assigned workouts
  personalWorkoutDays: number; // Days with personal workouts
  breakdown: PointsBreakdown[];
  lastUpdated: string; // ISO date
}

export interface PointsBreakdown {
  date: string; // ISO date (YYYY-MM-DD)
  workoutTitle: string;
  categoryType: PointCategoryType;
  points: number;
  duration: number; // minutes
  source: 'team' | 'coach' | 'personal'; // Where workout came from
  notes?: string;
}

export interface PointsConfig {
  weeklyTarget: number; // Default: 20 points per week
  categories: PointCategory[];
  maxDailyPoints?: number; // Optional: max points per day (e.g., 3)
  colorScale: {
    low: string;    // Red - below 50% of target
    medium: string; // Yellow - 50-80% of target
    high: string;   // Green - above 80% of target
  };
  updatedAt?: string;
  updatedBy?: string;
}

// Helper type for displaying progress
export interface PlayerPointsProgress {
  userId: string;
  userName: string;
  position: string;
  currentWeek: string;
  totalPoints: number;
  targetPoints: number;
  progressPercentage: number;
  color: string; // Based on colorScale
  rank: number; // Ranking among all players
  daysActive: number;
  lastWorkout?: string; // ISO date
}
