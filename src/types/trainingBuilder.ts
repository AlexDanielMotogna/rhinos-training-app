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
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * DTO for creating/editing a training template
 */
export interface TrainingTemplateDTO {
  trainingTypeId: string;
  positions: Position[]; // Multiple positions can share the same template
  blocks: {
    title: string;
    order: number;
    exerciseIds: string[];
  }[];
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
