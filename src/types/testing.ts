export type Sex = 'male' | 'female';
export type Segment = 'arms' | 'back' | 'shoulders' | 'legs' | 'core';
export type TestKey = 'bench' | 'row' | 'ohp' | 'squat' | 'trapbar' | 'plank';
export type Tier = 'pro' | 'semi' | 'club';

// Test Categories
export type TestCategory = 'strength' | 'speed' | 'power' | 'agility';

// Speed Tests
export type SpeedTestKey = 'dash40' | 'split10';

// Power Tests
export type PowerTestKey = 'verticalJump' | 'broadJump';

// Agility Tests
export type AgilityTestKey = 'proAgility' | 'threeCone';

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

// ===== SPEED TESTING =====
export interface SpeedInput {
  timeSeconds?: number;
}

export interface SpeedResult {
  key: SpeedTestKey;
  timeSeconds?: number;
  skipped?: boolean;
}

export interface SpeedSummary {
  byTest: SpeedResult[];
  speedScore: number; // 0-100
  label: 'ELITE' | 'FAST' | 'AVERAGE' | 'SLOW';
  tier: Tier;
  dateISO: string;
}

// ===== POWER TESTING =====
export interface PowerInput {
  distanceCm?: number; // for jumps in cm
  heightCm?: number; // for vertical jump
}

export interface PowerResult {
  key: PowerTestKey;
  distanceCm?: number;
  heightCm?: number;
  skipped?: boolean;
}

export interface PowerSummary {
  byTest: PowerResult[];
  powerScore: number; // 0-100
  label: 'EXPLOSIVE' | 'STRONG' | 'AVERAGE' | 'WEAK';
  tier: Tier;
  dateISO: string;
}

// ===== AGILITY TESTING =====
export interface AgilityInput {
  timeSeconds?: number;
}

export interface AgilityResult {
  key: AgilityTestKey;
  timeSeconds?: number;
  skipped?: boolean;
}

export interface AgilitySummary {
  byTest: AgilityResult[];
  agilityScore: number; // 0-100
  label: 'ELITE' | 'QUICK' | 'AVERAGE' | 'SLOW';
  tier: Tier;
  dateISO: string;
}

// Generic benchmark for time/distance based tests
export interface TestBenchmark {
  tierTargets: Record<Tier, BenchmarkTarget>;
}
