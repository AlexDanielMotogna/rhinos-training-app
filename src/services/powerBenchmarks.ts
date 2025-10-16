import type { Position } from '../types/exercise';
import type { TestBenchmark, PowerTestKey } from '../types/testing';

/**
 * Power test benchmarks by position
 * Based on NFL Combine data and adjusted for different competition levels
 *
 * Vertical Jump (cm):
 * - Measures vertical explosiveness
 * - Higher for skill positions, lower for linemen
 *
 * Broad Jump (cm):
 * - Measures horizontal power
 * - Correlates with overall explosiveness
 *
 * Note: 1 inch = 2.54 cm
 */

export function getPowerBenchmarks(position: Position): Record<PowerTestKey, TestBenchmark> {
  // Benchmarks organized by position groups
  const benchmarks: Record<string, Record<PowerTestKey, TestBenchmark>> = {
    // High-flying skill positions
    skill: {
      verticalJump: {
        tierTargets: {
          pro: { value: 97, unit: 's' },     // 38+ inches
          semi: { value: 89, unit: 's' },    // 35 inches
          club: { value: 81, unit: 's' },    // 32 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 305, unit: 's' },    // 120 inches / 10 feet
          semi: { value: 290, unit: 's' },   // 114 inches
          club: { value: 274, unit: 's' },   // 108 inches
        },
      },
    },

    // Running backs - explosive and powerful
    rb: {
      verticalJump: {
        tierTargets: {
          pro: { value: 94, unit: 's' },     // 37 inches
          semi: { value: 86, unit: 's' },    // 34 inches
          club: { value: 79, unit: 's' },    // 31 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 300, unit: 's' },    // 118 inches
          semi: { value: 285, unit: 's' },   // 112 inches
          club: { value: 269, unit: 's' },   // 106 inches
        },
      },
    },

    // Quarterbacks - decent athleticism
    qb: {
      verticalJump: {
        tierTargets: {
          pro: { value: 84, unit: 's' },     // 33 inches
          semi: { value: 76, unit: 's' },    // 30 inches
          club: { value: 69, unit: 's' },    // 27 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 279, unit: 's' },    // 110 inches
          semi: { value: 264, unit: 's' },   // 104 inches
          club: { value: 249, unit: 's' },   // 98 inches
        },
      },
    },

    // Linebackers - good all-around power
    lb: {
      verticalJump: {
        tierTargets: {
          pro: { value: 91, unit: 's' },     // 36 inches
          semi: { value: 84, unit: 's' },    // 33 inches
          club: { value: 76, unit: 's' },    // 30 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 295, unit: 's' },    // 116 inches
          semi: { value: 279, unit: 's' },   // 110 inches
          club: { value: 264, unit: 's' },   // 104 inches
        },
      },
    },

    // Tight Ends - big and athletic
    te: {
      verticalJump: {
        tierTargets: {
          pro: { value: 89, unit: 's' },     // 35 inches
          semi: { value: 81, unit: 's' },    // 32 inches
          club: { value: 74, unit: 's' },    // 29 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 290, unit: 's' },    // 114 inches
          semi: { value: 274, unit: 's' },   // 108 inches
          club: { value: 259, unit: 's' },   // 102 inches
        },
      },
    },

    // Defensive Line - powerful but heavy
    dl: {
      verticalJump: {
        tierTargets: {
          pro: { value: 81, unit: 's' },     // 32 inches
          semi: { value: 74, unit: 's' },    // 29 inches
          club: { value: 66, unit: 's' },    // 26 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 274, unit: 's' },    // 108 inches
          semi: { value: 259, unit: 's' },   // 102 inches
          club: { value: 244, unit: 's' },   // 96 inches
        },
      },
    },

    // Offensive Line - least explosive but still powerful
    ol: {
      verticalJump: {
        tierTargets: {
          pro: { value: 71, unit: 's' },     // 28 inches
          semi: { value: 64, unit: 's' },    // 25 inches
          club: { value: 56, unit: 's' },    // 22 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 254, unit: 's' },    // 100 inches
          semi: { value: 239, unit: 's' },   // 94 inches
          club: { value: 224, unit: 's' },   // 88 inches
        },
      },
    },

    // Kickers/Punters - leg power focused
    kp: {
      verticalJump: {
        tierTargets: {
          pro: { value: 76, unit: 's' },     // 30 inches
          semi: { value: 69, unit: 's' },    // 27 inches
          club: { value: 61, unit: 's' },    // 24 inches
        },
      },
      broadJump: {
        tierTargets: {
          pro: { value: 269, unit: 's' },    // 106 inches
          semi: { value: 254, unit: 's' },   // 100 inches
          club: { value: 239, unit: 's' },   // 94 inches
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
