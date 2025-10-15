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

export interface TemplateBlock {
  order: number;
  title: string;
  items: Exercise[];
}

export interface PositionTemplate {
  blocks: TemplateBlock[];
}

export type TemplatesByType = Record<
  TrainingTypeKey,
  Partial<Record<Position, PositionTemplate>>
>;
