import type { Sex, Segment, SegmentBenchmark } from '../types/testing';

type Position = 'RB' | 'WR' | 'LB' | 'OL' | 'DB' | 'QB' | 'DL' | 'TE' | 'K/P';

export function getBenchmarks(
  _position: Position,
  sex: Sex
): Record<Segment, SegmentBenchmark> {
  // Base benchmarks for male RB (most common)
  const baseMale: Record<Segment, SegmentBenchmark> = {
    arms: {
      tierTargets: {
        pro: { value: 1.35, unit: 'xBW' },
        semi: { value: 1.15, unit: 'xBW' },
        club: { value: 0.95, unit: 'xBW' },
      },
    },
    shoulders: {
      tierTargets: {
        pro: { value: 0.90, unit: 'xBW' },
        semi: { value: 0.75, unit: 'xBW' },
        club: { value: 0.60, unit: 'xBW' },
      },
    },
    back: {
      tierTargets: {
        pro: { value: 1.10, unit: 'xBW' },
        semi: { value: 0.95, unit: 'xBW' },
        club: { value: 0.80, unit: 'xBW' },
      },
    },
    legs: {
      tierTargets: {
        pro: { value: 2.00, unit: 'xBW' }, // avg of squat 1.80 + trapbar 2.20
        semi: { value: 1.65, unit: 'xBW' }, // avg of 1.50 + 1.80
        club: { value: 1.35, unit: 'xBW' }, // avg of 1.20 + 1.50
      },
    },
    core: {
      tierTargets: {
        pro: { value: 150, unit: 's' },
        semi: { value: 120, unit: 's' },
        club: { value: 90, unit: 's' },
      },
    },
  };

  // Adjust for female (approximately -25% for strength, -20% for core)
  if (sex === 'female') {
    return {
      arms: {
        tierTargets: {
          pro: { value: 1.01, unit: 'xBW' },
          semi: { value: 0.86, unit: 'xBW' },
          club: { value: 0.71, unit: 'xBW' },
        },
      },
      shoulders: {
        tierTargets: {
          pro: { value: 0.68, unit: 'xBW' },
          semi: { value: 0.56, unit: 'xBW' },
          club: { value: 0.45, unit: 'xBW' },
        },
      },
      back: {
        tierTargets: {
          pro: { value: 0.83, unit: 'xBW' },
          semi: { value: 0.71, unit: 'xBW' },
          club: { value: 0.60, unit: 'xBW' },
        },
      },
      legs: {
        tierTargets: {
          pro: { value: 1.50, unit: 'xBW' },
          semi: { value: 1.24, unit: 'xBW' },
          club: { value: 1.01, unit: 'xBW' },
        },
      },
      core: {
        tierTargets: {
          pro: { value: 120, unit: 's' },
          semi: { value: 96, unit: 's' },
          club: { value: 72, unit: 's' },
        },
      },
    };
  }

  // Position adjustments (simplified - all use male base for now)
  // In production, you'd have different targets per position
  return baseMale;
}
