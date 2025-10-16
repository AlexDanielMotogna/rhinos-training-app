import type { Position } from '../types/exercise';
import type { TestBenchmark, SpeedTestKey } from '../types/testing';

/**
 * Speed test benchmarks by position
 * Based on NFL Combine data and adjusted for different competition levels
 *
 * 40-Yard Dash times (seconds):
 * - Skill positions (WR, RB, DB, QB): Faster
 * - Hybrid positions (LB, TE): Medium
 * - Line positions (OL, DL): Slower
 * - Specialists (K/P): Variable
 *
 * 10-Yard Split times (seconds):
 * - Measures explosion/acceleration
 * - Generally ~40% of 40-yard dash time
 */

export function getSpeedBenchmarks(position: Position): Record<SpeedTestKey, TestBenchmark> {
  // Benchmarks organized by position groups
  const benchmarks: Record<string, Record<SpeedTestKey, TestBenchmark>> = {
    // Fast skill positions
    skill: {
      dash40: {
        tierTargets: {
          pro: { value: 4.45, unit: 's' },    // NFL Elite (WR/DB)
          semi: { value: 4.60, unit: 's' },   // Semi-Pro
          club: { value: 4.80, unit: 's' },   // Club level
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.55, unit: 's' },
          semi: { value: 1.65, unit: 's' },
          club: { value: 1.75, unit: 's' },
        },
      },
    },

    // Running backs - similar to skill but slightly slower
    rb: {
      dash40: {
        tierTargets: {
          pro: { value: 4.50, unit: 's' },
          semi: { value: 4.65, unit: 's' },
          club: { value: 4.85, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.58, unit: 's' },
          semi: { value: 1.68, unit: 's' },
          club: { value: 1.78, unit: 's' },
        },
      },
    },

    // Quarterbacks - moderately fast
    qb: {
      dash40: {
        tierTargets: {
          pro: { value: 4.70, unit: 's' },
          semi: { value: 4.85, unit: 's' },
          club: { value: 5.00, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.65, unit: 's' },
          semi: { value: 1.75, unit: 's' },
          club: { value: 1.85, unit: 's' },
        },
      },
    },

    // Linebackers - hybrid speed/power
    lb: {
      dash40: {
        tierTargets: {
          pro: { value: 4.65, unit: 's' },
          semi: { value: 4.80, unit: 's' },
          club: { value: 5.00, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.62, unit: 's' },
          semi: { value: 1.72, unit: 's' },
          club: { value: 1.82, unit: 's' },
        },
      },
    },

    // Tight Ends - bigger but athletic
    te: {
      dash40: {
        tierTargets: {
          pro: { value: 4.75, unit: 's' },
          semi: { value: 4.90, unit: 's' },
          club: { value: 5.10, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.68, unit: 's' },
          semi: { value: 1.78, unit: 's' },
          club: { value: 1.88, unit: 's' },
        },
      },
    },

    // Defensive Line - powerful but slower
    dl: {
      dash40: {
        tierTargets: {
          pro: { value: 4.90, unit: 's' },
          semi: { value: 5.10, unit: 's' },
          club: { value: 5.30, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.70, unit: 's' },
          semi: { value: 1.80, unit: 's' },
          club: { value: 1.90, unit: 's' },
        },
      },
    },

    // Offensive Line - slowest but powerful
    ol: {
      dash40: {
        tierTargets: {
          pro: { value: 5.30, unit: 's' },
          semi: { value: 5.50, unit: 's' },
          club: { value: 5.70, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.85, unit: 's' },
          semi: { value: 1.95, unit: 's' },
          club: { value: 2.05, unit: 's' },
        },
      },
    },

    // Kickers/Punters - variable, use QB standards
    kp: {
      dash40: {
        tierTargets: {
          pro: { value: 4.90, unit: 's' },
          semi: { value: 5.10, unit: 's' },
          club: { value: 5.30, unit: 's' },
        },
      },
      split10: {
        tierTargets: {
          pro: { value: 1.75, unit: 's' },
          semi: { value: 1.85, unit: 's' },
          club: { value: 1.95, unit: 's' },
        },
      },
    },
  };

  // Map positions to benchmark groups
  switch (position) {
    case 'WR':
    case 'DB':
      return benchmarks.skill;
    case 'RB':
      return benchmarks.rb;
    case 'QB':
      return benchmarks.qb;
    case 'LB':
      return benchmarks.lb;
    case 'TE':
      return benchmarks.te;
    case 'DL':
      return benchmarks.dl;
    case 'OL':
      return benchmarks.ol;
    case 'K/P':
      return benchmarks.kp;
    default:
      return benchmarks.skill; // fallback
  }
}
