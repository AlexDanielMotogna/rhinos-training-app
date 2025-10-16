import type { AgilityTestKey, AgilityResult } from '../types/testing';

/**
 * Calculate score for an agility test based on time
 * Lower time = higher score (0-100 scale)
 * @param timeSeconds - measured time in seconds
 * @param targetTime - benchmark target time for tier
 * @returns score 0-100
 */
export function agilityScore(timeSeconds: number, targetTime: number): number {
  // For agility tests, lower is better (like speed)
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
 * Calculate overall agility index from multiple test results
 * Weighted: Pro Agility (50%), 3-Cone Drill (50%)
 */
export function agilityIndex(scores: Record<AgilityTestKey, number>): number {
  const weights = {
    proAgility: 0.5,
    threeCone: 0.5,
  };

  const index =
    scores.proAgility * weights.proAgility +
    scores.threeCone * weights.threeCone;

  return Math.round(index);
}

/**
 * Get performance label from agility index
 */
export function labelFromAgilityIndex(index: number): 'ELITE' | 'QUICK' | 'AVERAGE' | 'SLOW' {
  if (index >= 85) return 'ELITE';
  if (index >= 70) return 'QUICK';
  if (index >= 50) return 'AVERAGE';
  return 'SLOW';
}

/**
 * Format time in seconds to display format (e.g., "4.52s")
 */
export function formatTime(seconds: number): string {
  return `${seconds.toFixed(2)}s`;
}

/**
 * Get detail string for agility result
 */
export function getAgilityDetail(result: AgilityResult): string {
  if (result.skipped || !result.timeSeconds) return '-';
  return formatTime(result.timeSeconds);
}
