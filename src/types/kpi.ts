export type PlayerLabel = 'MACHINE' | 'STEADY' | 'IRREGULAR' | 'LAZY';

export interface KPISnapshot {
  levelScore: number;
  weeklyScore: number;
  weeklyMinutes: number;
  planMinutes: number;
  freeMinutes: number;
  freeSharePct: number;
  labels: PlayerLabel[];
}

export interface ProjectionRow {
  week: number;
  score: number;
  compliance: number;
  totalMin: number;
}
