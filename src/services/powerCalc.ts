import type { PowerTestKey, PowerResult } from '../types/testing';

/**
 * Calculate score for a power test based on distance/height
 * Higher distance = higher score (0-100 scale)
 * @param value - measured distance in cm
 * @param targetValue - benchmark target distance for tier
 * @returns score 0-100
 */
export function powerScore(value: number, targetValue: number): number {
  // For power tests, higher is better
  // Score = 100 if value >= target
  // Score decreases as value falls below target

  if (value >= targetValue) {
    return 100;
  }

  // For every 10% below target, lose 20 points
  const percentBelow = ((targetValue - value) / targetValue) * 100;
  const penalty = percentBelow * 2;
  const score = Math.max(0, 100 - penalty);

  return Math.round(score);
}

/**
 * Calculate overall power index from multiple test results
 * Weighted: Vertical Jump (50%), Broad Jump (50%)
 */
export function powerIndex(scores: Record<PowerTestKey, number>): number {
  const weights = {
    verticalJump: 0.5,
    broadJump: 0.5,
  };

  const index =
    scores.verticalJump * weights.verticalJump +
    scores.broadJump * weights.broadJump;

  return Math.round(index);
}

/**
 * Get performance label from power index
 */
export function labelFromPowerIndex(index: number): 'EXPLOSIVE' | 'STRONG' | 'AVERAGE' | 'WEAK' {
  if (index >= 85) return 'EXPLOSIVE';
  if (index >= 70) return 'STRONG';
  if (index >= 50) return 'AVERAGE';
  return 'WEAK';
}

/**
 * Convert cm to inches for US users
 */
export function cmToInches(cm: number): number {
  return Math.round(cm / 2.54 * 10) / 10;
}

/**
 * Format distance in cm to display format
 */
export function formatDistance(cm: number): string {
  return `${cm} cm (${cmToInches(cm)}")`;
}

/**
 * Get detail string for power result
 */
export function getPowerDetail(result: PowerResult): string {
  if (result.skipped) return '-';

  if (result.key === 'verticalJump' && result.heightCm) {
    return formatDistance(result.heightCm);
  }

  if (result.key === 'broadJump' && result.distanceCm) {
    return formatDistance(result.distanceCm);
  }

  return '-';
}
