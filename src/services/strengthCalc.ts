import type { TestKey, Segment, StrengthResult } from '../types/testing';

// Epley formula for 1RM estimation
export function epley1RM(weightKg: number, reps: number): number {
  if (reps === 1) return weightKg;
  return Math.round(weightKg * (1 + reps / 30) * 10) / 10;
}

// Calculate relative value to bodyweight (2 decimals)
export function relative(valueKg: number, bodyWeightKg: number): number {
  return Math.round((valueKg / bodyWeightKg) * 100) / 100;
}

// Map test to segment
export function testToSegment(testKey: TestKey): Segment {
  const mapping: Record<TestKey, Segment> = {
    bench: 'arms',
    row: 'back',
    ohp: 'shoulders',
    squat: 'legs',
    trapbar: 'legs',
    plank: 'core',
  };
  return mapping[testKey];
}

// Calculate segment score (0-100)
export function segmentScore(
  _segment: Segment,
  metric: number,
  target: number,
  _unit: 'xBW' | 'kg' | 's'
): number {
  const raw = (metric / target) * 100;
  return Math.min(100, Math.round(raw));
}

// Calculate strength index from segment scores
export function strengthIndex(scores: Record<Segment, number>): number {
  const weights = {
    legs: 0.35,
    arms: 0.20,
    back: 0.20,
    shoulders: 0.15,
    core: 0.10,
  };

  const index =
    scores.legs * weights.legs +
    scores.arms * weights.arms +
    scores.back * weights.back +
    scores.shoulders * weights.shoulders +
    scores.core * weights.core;

  return Math.round(index);
}

// Get label from index
export function labelFromIndex(idx: number): 'MACHINE' | 'STEADY' | 'IRREGULAR' | 'LAZY' {
  if (idx >= 85) return 'MACHINE';
  if (idx >= 70) return 'STEADY';
  if (idx >= 50) return 'IRREGULAR';
  return 'LAZY';
}

// Compose legs value from squat and trapbar
export function composeLegsValue(results: StrengthResult[]): number | undefined {
  const squat = results.find(r => r.key === 'squat' && !r.skipped);
  const trapbar = results.find(r => r.key === 'trapbar' && !r.skipped);

  const values = [squat?.oneRmRel, trapbar?.oneRmRel].filter((v): v is number => v !== undefined);

  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

// Get segment metric from results
export function getSegmentMetric(segment: Segment, results: StrengthResult[]): number | undefined {
  if (segment === 'legs') {
    return composeLegsValue(results);
  }

  if (segment === 'core') {
    const plank = results.find(r => r.key === 'plank' && !r.skipped);
    return plank?.seconds;
  }

  // For arms, back, shoulders - find the test
  const testKey: TestKey | undefined =
    segment === 'arms' ? 'bench' :
    segment === 'back' ? 'row' :
    segment === 'shoulders' ? 'ohp' :
    undefined;

  if (!testKey) return undefined;

  const result = results.find(r => r.key === testKey && !r.skipped);
  return result?.oneRmRel;
}
