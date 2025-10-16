import type { Position } from '../types/exercise';
import type { TestBenchmark, AgilityTestKey } from '../types/testing';

/**
 * Agility test benchmarks by position
 * Based on NFL Combine data and adjusted for different competition levels
 *
 * Pro Agility (20-Yard Shuttle / 5-10-5) - seconds:
 * - Measures lateral quickness and change of direction
 * - Sprint 5 yards right, 10 yards left, 5 yards right
 *
 * 3-Cone Drill (L-Drill) - seconds:
 * - Measures agility, acceleration, and body control
 * - Complex pattern with multiple direction changes
 */

export function getAgilityBenchmarks(position: Position): Record<AgilityTestKey, TestBenchmark> {
  // Benchmarks organized by position groups
  const benchmarks: Record<string, Record<AgilityTestKey, TestBenchmark>> = {
    // Elite agility skill positions
    skill: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.10, unit: 's' },    // NFL Elite
          semi: { value: 4.30, unit: 's' },   // Semi-Pro
          club: { value: 4.50, unit: 's' },   // Club level
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 6.80, unit: 's' },
          semi: { value: 7.10, unit: 's' },
          club: { value: 7.40, unit: 's' },
        },
      },
    },

    // Running backs - very agile
    rb: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.15, unit: 's' },
          semi: { value: 4.35, unit: 's' },
          club: { value: 4.55, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 6.90, unit: 's' },
          semi: { value: 7.20, unit: 's' },
          club: { value: 7.50, unit: 's' },
        },
      },
    },

    // Quarterbacks - decent agility
    qb: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.30, unit: 's' },
          semi: { value: 4.50, unit: 's' },
          club: { value: 4.70, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 7.10, unit: 's' },
          semi: { value: 7.40, unit: 's' },
          club: { value: 7.70, unit: 's' },
        },
      },
    },

    // Linebackers - agile for their size
    lb: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.25, unit: 's' },
          semi: { value: 4.45, unit: 's' },
          club: { value: 4.65, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 7.00, unit: 's' },
          semi: { value: 7.30, unit: 's' },
          club: { value: 7.60, unit: 's' },
        },
      },
    },

    // Tight Ends - moderate agility
    te: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.40, unit: 's' },
          semi: { value: 4.60, unit: 's' },
          club: { value: 4.80, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 7.20, unit: 's' },
          semi: { value: 7.50, unit: 's' },
          club: { value: 7.80, unit: 's' },
        },
      },
    },

    // Defensive Line - decent for size
    dl: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.50, unit: 's' },
          semi: { value: 4.75, unit: 's' },
          club: { value: 5.00, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 7.40, unit: 's' },
          semi: { value: 7.75, unit: 's' },
          club: { value: 8.10, unit: 's' },
        },
      },
    },

    // Offensive Line - least agile but still functional
    ol: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.80, unit: 's' },
          semi: { value: 5.10, unit: 's' },
          club: { value: 5.40, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 7.80, unit: 's' },
          semi: { value: 8.20, unit: 's' },
          club: { value: 8.60, unit: 's' },
        },
      },
    },

    // Kickers/Punters - variable, use QB standards
    kp: {
      proAgility: {
        tierTargets: {
          pro: { value: 4.50, unit: 's' },
          semi: { value: 4.75, unit: 's' },
          club: { value: 5.00, unit: 's' },
        },
      },
      threeCone: {
        tierTargets: {
          pro: { value: 7.40, unit: 's' },
          semi: { value: 7.75, unit: 's' },
          club: { value: 8.10, unit: 's' },
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
