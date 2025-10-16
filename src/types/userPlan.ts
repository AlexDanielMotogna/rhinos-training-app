/**
 * User Plan Template Types
 * User-created workout plans/templates
 */

import type { ExerciseCategory } from './exercise';

/**
 * Exercise within a plan template
 * Defines target/goal values for the exercise
 * Note: Weight (kg) is NOT stored in template - it's logged during workout
 */
export interface PlanExercise {
  id: string; // Unique ID for this exercise in the plan
  exerciseId?: string; // Reference to global exercise catalog (optional)
  name: string;
  category: ExerciseCategory;
  youtubeUrl?: string;

  // Target values (goals for this exercise)
  targetSets: number;
  targetReps?: number;
  targetDurationSec?: number; // For Speed/Conditioning/Mobility exercises (in seconds)

  notes?: string;
  order: number; // Display order in the plan
}

/**
 * User Plan Template
 * A reusable workout plan created by the user
 */
export interface UserPlanTemplate {
  id: string;
  userId: string;
  name: string; // e.g., "Upper Body", "Leg Day"
  exercises: PlanExercise[];
  createdAt: string;
  updatedAt: string;
  lastUsed?: string; // Last time this plan was executed
  timesCompleted: number; // How many times user completed this plan
}

/**
 * Payload for creating/updating a plan
 */
export type UserPlanPayload = Omit<UserPlanTemplate, 'id' | 'createdAt' | 'updatedAt' | 'timesCompleted'>;

/**
 * Stats for a plan
 */
export interface PlanStats {
  planId: string;
  totalWorkouts: number;
  lastCompleted?: string;
  averageDuration?: number; // in minutes
  exercises: {
    name: string;
    bestSet?: {
      reps: number;
      kg: number;
    };
    progression: Array<{
      date: string;
      avgKg: number;
      avgReps: number;
    }>;
  }[];
}
