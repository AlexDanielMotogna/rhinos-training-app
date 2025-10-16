export type Sex = 'male' | 'female';
export type Segment = 'arms' | 'back' | 'shoulders' | 'legs' | 'core';
export type TestKey = 'bench' | 'row' | 'ohp' | 'squat' | 'trapbar' | 'plank';
export type Tier = 'pro' | 'semi' | 'club';

export interface StrengthInput {
  weightKg?: number;
  reps?: number;
  seconds?: number;
  rpe?: number;
}

export interface StrengthResult {
  key: TestKey;
  segment: Segment;
  oneRmEstKg?: number;
  oneRmRel?: number;
  seconds?: number;
  skipped?: boolean;
}

export interface StrengthSummary {
  byTest: StrengthResult[];
  bySegment: Record<Segment, { score: number; detail: string }>;
  strengthIndex: number;
  label: 'MACHINE' | 'STEADY' | 'IRREGULAR' | 'LAZY';
  tier: Tier;
  dateISO: string;
}

export interface BenchmarkTarget {
  value: number;
  unit: 'xBW' | 's' | 'kg';
}

export interface SegmentBenchmark {
  tierTargets: Record<Tier, BenchmarkTarget>;
}
