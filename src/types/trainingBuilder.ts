import type { Exercise, Position } from './exercise';

/**
 * A block is a section within a training template
 * Examples: "Compound Lifts", "Accessory Work", "Speed Drills"
 */
export interface TrainingBlock {
  id: string;
  title: string; // e.g., "Compound Lifts", "Accessory Work"
  order: number; // Display order (1, 2, 3...)
  exercises: Exercise[]; // Exercises in this block
}

/**
 * A training template defines the structure of a training type
 * for one or more positions
 */
export interface TrainingTemplate {
  id: string;
  trainingTypeId: string; // FK to TrainingType
  trainingTypeName: string; // Denormalized for display
  positions: Position[]; // Which positions this template is for (can be multiple)
  blocks: TrainingBlock[]; // Ordered blocks
  durationWeeks: number; // Program duration in weeks (e.g., 8)
  frequencyPerWeek: string; // Recommended frequency (e.g., "2-3")
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Exercise configuration within a block
 */
export interface ExerciseConfig {
  exerciseId: string;
  sets?: number; // Target sets for this specific exercise
}

/**
 * DTO for creating/editing a training template
 */
export interface TrainingTemplateDTO {
  trainingTypeId: string;
  positions: Position[]; // Multiple positions can share the same template
  durationWeeks: number; // Program duration in weeks
  frequencyPerWeek: string; // Recommended frequency (e.g., "2-3", "3", "4-5")
  blocks: {
    title: string;
    order: number;
    exerciseIds: string[];
    exerciseConfigs?: ExerciseConfig[]; // Configuration for each exercise (sets, etc.)
    globalSets?: number; // Global sets that apply to all exercises in the block
  }[];
}

/**
 * Training Assignment - When a coach assigns a template to players with specific dates
 */
export interface TrainingAssignment {
  id: string;
  templateId: string; // FK to TrainingTemplate
  playerIds: string[]; // All players assigned to this program
  startDate: string; // ISO date string (e.g., "2025-10-16")
  endDate: string; // ISO date string (calculated from startDate + durationWeeks)
  active: boolean;
  createdAt: string;
  createdBy: string; // Coach who assigned it
}

/**
 * DTO for creating a training assignment
 */
export interface TrainingAssignmentDTO {
  templateId: string;
  playerIds: string[];
  startDate: string; // ISO date string
}

/**
 * Training Type (already exists in Admin.tsx but should be shared)
 */
export interface TrainingType {
  id: string;
  key: string; // e.g., "strength_conditioning"
  nameEN: string;
  nameDE: string;
  season: 'in-season' | 'off-season' | 'pre-season';
  active: boolean;
}
