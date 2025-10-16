import type { Exercise, Position } from './exercise';

export type TrainingTypeKey = 'strength_conditioning' | 'sprints_speed';

export type Season = 'in-season' | 'off-season' | 'pre-season';

export interface TrainingTypeMeta {
  key: TrainingTypeKey;
  nameEN: string;
  nameDE: string;
  season: Season;
  active: boolean;
}

export interface ExerciseWithSets extends Exercise {
  targetSets?: number; // Target sets for this exercise
}

export interface TemplateBlock {
  order: number;
  title: string;
  items: Exercise[];
  globalSets?: number; // Global sets that apply to all exercises in the block
  exerciseConfigs?: { exerciseId: string; sets?: number }[]; // Individual sets per exercise
}

export interface PositionTemplate {
  blocks: TemplateBlock[];
}

export type TemplatesByType = Record<
  TrainingTypeKey,
  Partial<Record<Position, PositionTemplate>>
>;
