import type { ExerciseCategory } from './exercise';
import type { TrainingTypeKey } from './template';

export type WorkoutSource = 'coach' | 'player';

export interface SetData {
  setNumber: number;
  reps?: number;
  kg?: number;
  durationSec?: number; // Changed from durationMin to durationSec
  distance?: number; // Distance in kilometers for cardio/running sets
}

export interface WorkoutEntry {
  id?: string;
  exerciseId?: string;
  name: string;
  category: ExerciseCategory;
  sets?: number;
  reps?: number;
  kg?: number;
  durationSec?: number; // Changed from durationMin to durationSec
  distance?: number; // Distance in kilometers for cardio/running exercises
  setData?: SetData[]; // Individual set tracking
  rpe?: number;
  source: WorkoutSource;
  specific?: boolean;
  youtubeUrl?: string;
  notes?: string;
}

export interface WorkoutPayload {
  trainingTypeKey?: TrainingTypeKey;
  dateISO: string;
  entries: WorkoutEntry[];
  notes?: string;
  source: WorkoutSource;
}

export interface CoachReview {
  entryId: string;
  mark: 'specific' | 'non_specific';
  promotedToCatalog?: boolean;
}
