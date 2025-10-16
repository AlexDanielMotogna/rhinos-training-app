import type { SpeedTestKey, SpeedResult } from '../types/testing';

/**
 * Calculate score for a speed test based on time
 * Lower time = higher score (0-100 scale)
 * @param timeSeconds - measured time in seconds
 * @param targetTime - benchmark target time for tier
 * @returns score 0-100
 */
export function speedScore(timeSeconds: number, targetTime: number): number {
  // For speed tests, lower is better
  // Score = 100 if time <= target
  // Score decreases as time increases above target

  if (timeSeconds <= targetTime) {
    return 100;
  }

  // For every 10% slower than target, lose 20 points
  const percentSlower = ((timeSeconds - targetTime) / targetTime) * 100;
  const penalty = percentSlower * 2;
  const score = Math.max(0, 100 - penalty);

  return Math.round(score);
}

/**
 * Calculate overall speed index from multiple test results
 * Weighted: 40-yard dash (70%), 10-yard split (30%)
 */
export function speedIndex(scores: Record<SpeedTestKey, number>): number {
  const weights = {
    dash40: 0.7,
    split10: 0.3,
  };

  const index =
    scores.dash40 * weights.dash40 +
    scores.split10 * weights.split10;

  return Math.round(index);
}

/**
 * Get performance label from speed index
 */
export function labelFromSpeedIndex(index: number): 'ELITE' | 'FAST' | 'AVERAGE' | 'SLOW' {
  if (index >= 85) return 'ELITE';
  if (index >= 70) return 'FAST';
  if (index >= 50) return 'AVERAGE';
  return 'SLOW';
}

/**
 * Convert yards to meters for international users
 */
export function yardsToMeters(yards: number): number {
  return Math.round(yards * 0.9144 * 100) / 100;
}

/**
 * Format time in seconds to display format (e.g., "4.52s")
 */
export function formatTime(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

/**
 * Get detail string for speed result
 */
export function getSpeedDetail(result: SpeedResult): string {
  if (result.skipped || !result.timeSeconds) return '-';
  return formatTime(result.timeSeconds);
}
