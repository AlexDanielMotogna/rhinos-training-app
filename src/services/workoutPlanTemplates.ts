/**
 * 8-Week Strength & Conditioning Plan Templates for Rhinos
 * Based on official training documentation
 */

import type { UserPlanTemplate, PlanExercise } from '../types/userPlan';
import type { Position } from '../types/exercise';

/**
 * Generate unique ID for exercises
 */
function generateExerciseId(): string {
  return `ex_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * MONDAY - Lower Body (Strength/Power)
 */
function createMondayLowerBodyPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Back Squat',
      category: 'Strength',
      targetSets: 4,
      targetReps: 8,
      notes: 'Phase 1: Lower 3s, explosive up | Phase 2: Lower 2s, explosive up. 70-85% 1RM',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Romanian Deadlift',
      category: 'Strength',
      targetSets: 4,
      targetReps: 8,
      notes: 'Controlled movement, eccentric 3s. Focus on hamstrings',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Walking Lunges',
      category: 'Strength',
      targetSets: 3,
      targetReps: 12,
      notes: 'Fluid and stable. 12 reps per leg',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Calf Raises',
      category: 'Strength',
      targetSets: 4,
      targetReps: 15,
      notes: '1s hold at top, 3s lower',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: 'Plank Hold',
      category: 'Strength',
      targetSets: 3,
      targetDurationSec: 60,
      notes: 'Core stability. Variations: front/side plank',
      order: 5,
    },
  ];

  return {
    id: `plan_monday_lower_${Date.now()}`,
    userId,
    name: 'Monday - Lower Body',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * TUESDAY - Speed & Agility (Field Work)
 */
function createTuesdaySpeedAgilityPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Dynamic Warm-up',
      category: 'Mobility',
      targetSets: 1,
      targetDurationSec: 600,
      notes: 'A-skips, high knees, carioca - 10 min',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: '20yd Sprints',
      category: 'Speed',
      targetSets: 10,
      targetReps: 1,
      notes: '100% explosive, 90s rest between sprints',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Pro Agility Drill (5-10-5)',
      category: 'COD',
      targetSets: 6,
      targetReps: 1,
      notes: 'Explosive cuts, sharp direction changes',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'T-Drill',
      category: 'COD',
      targetSets: 6,
      targetReps: 1,
      notes: 'Speed + control at each cut point',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: '40yd Conditioning',
      category: 'Conditioning',
      targetSets: 6,
      targetReps: 1,
      notes: '70% effort, 30s rest. Building work capacity',
      order: 5,
    },
  ];

  return {
    id: `plan_tuesday_speed_${Date.now()}`,
    userId,
    name: 'Tuesday - Speed & Agility',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * WEDNESDAY - Upper Body (Strength/Power)
 */
function createWednesdayUpperBodyPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Bench Press',
      category: 'Strength',
      targetSets: 4,
      targetReps: 8,
      notes: 'Phase 1: Eccentric 3s, strong concentric | Phase 2: Explosive up. 70-85% 1RM',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Pull-ups',
      category: 'Strength',
      targetSets: 4,
      targetReps: 8,
      notes: 'Controlled, no kipping. Max reps with good form',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Overhead Press',
      category: 'Strength',
      targetSets: 4,
      targetReps: 8,
      notes: 'Phase 1: Slow | Phase 2: Explosive',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Barbell Row',
      category: 'Strength',
      targetSets: 4,
      targetReps: 8,
      notes: 'Controlled, back fixed, no momentum',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: 'Hanging Leg Raises',
      category: 'Strength',
      targetSets: 3,
      targetReps: 12,
      notes: 'Core strength. Controlled movement',
      order: 5,
    },
  ];

  return {
    id: `plan_wednesday_upper_${Date.now()}`,
    userId,
    name: 'Wednesday - Upper Body',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * THURSDAY - Plyometrics & Conditioning (Field Work)
 */
function createThursdayPlyoConditioningPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Bounding',
      category: 'Plyometrics',
      targetSets: 10,
      targetReps: 1,
      notes: '20m each set. Explosive, spring-like. Max ground contact',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Sled Sprint',
      category: 'Speed',
      targetSets: 6,
      targetReps: 1,
      notes: '15yd with sled. Explosive, powerful steps',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Lateral Hops',
      category: 'Plyometrics',
      targetSets: 4,
      targetReps: 12,
      notes: 'Quick, elastic. Minimal ground contact',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Medicine Ball Slams',
      category: 'Plyometrics',
      targetSets: 4,
      targetReps: 12,
      notes: 'Explosive core. Full extension',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: 'Russian Twists',
      category: 'Strength',
      targetSets: 3,
      targetReps: 20,
      notes: 'Core rotation. Controlled movement',
      order: 5,
    },
    {
      id: generateExerciseId(),
      name: '100yd Conditioning Sprints',
      category: 'Conditioning',
      targetSets: 10,
      targetReps: 1,
      notes: '75-80% effort. Building game conditioning',
      order: 6,
    },
  ];

  return {
    id: `plan_thursday_plyo_${Date.now()}`,
    userId,
    name: 'Thursday - Plyometrics & Conditioning',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * FRIDAY - Full Body Explosive
 */
function createFridayFullBodyPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Power Clean',
      category: 'Plyometrics',
      targetSets: 5,
      targetReps: 3,
      notes: 'Always explosive. Moderate load (70-75% 1RM). Triple extension',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Front Squat',
      category: 'Strength',
      targetSets: 4,
      targetReps: 6,
      notes: 'Controlled descent, explosive concentric',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Push Press',
      category: 'Plyometrics',
      targetSets: 4,
      targetReps: 6,
      notes: 'Explosive leg drive. Full overhead extension',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Dips',
      category: 'Strength',
      targetSets: 3,
      targetReps: 12,
      notes: '1s lower, 1s up. Controlled tempo',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: 'Farmer Carries',
      category: 'Strength',
      targetSets: 3,
      targetDurationSec: 40,
      notes: '40m distance. Firm grip, core tight, upright posture',
      order: 5,
    },
  ];

  return {
    id: `plan_friday_fullbody_${Date.now()}`,
    userId,
    name: 'Friday - Full Body Explosive',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * POSITION-SPECIFIC PLANS
 */

/**
 * LINEMEN (OL/DL) - Heavy Load Emphasis
 */
function createLinemenSpecialPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Sled Push',
      category: 'Strength',
      targetSets: 6,
      targetReps: 1,
      notes: '15yd heavy sled. Explosive drive, low body angle',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Trap Bar Deadlift',
      category: 'Strength',
      targetSets: 5,
      targetReps: 5,
      notes: 'Explosive concentric. 75-90% 1RM. Lower controlled',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Heavy Back Squat',
      category: 'Strength',
      targetSets: 5,
      targetReps: 5,
      notes: '80-90% 1RM. Controlled eccentric, explosive concentric',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Bench Press (Heavy)',
      category: 'Strength',
      targetSets: 5,
      targetReps: 5,
      notes: '80-85% 1RM. Pause at chest, explosive up',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: '5-10yd Sprint Bursts',
      category: 'Speed',
      targetSets: 8,
      targetReps: 1,
      notes: 'Short explosive bursts. Simulating line play',
      order: 5,
    },
  ];

  return {
    id: `plan_linemen_${Date.now()}`,
    userId,
    name: 'Linemen - Heavy Power',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * BIG SKILL (LB, TE, FB, S) - Balance Strength & Explosiveness
 */
function createBigSkillPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Power Clean',
      category: 'Plyometrics',
      targetSets: 5,
      targetReps: 3,
      notes: 'Explosive triple extension. 70-80% 1RM',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Back Squat',
      category: 'Strength',
      targetSets: 4,
      targetReps: 6,
      notes: '70-80% 1RM. Controlled down, explosive up',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Bench Press',
      category: 'Strength',
      targetSets: 4,
      targetReps: 6,
      notes: '70-80% 1RM. Power focus',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Lateral Cone Drill + Reaction',
      category: 'COD',
      targetSets: 5,
      targetReps: 1,
      notes: 'Agility + reaction to coach signal',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: 'Box Jumps',
      category: 'Plyometrics',
      targetSets: 4,
      targetReps: 5,
      notes: 'Maximum explosiveness. Full hip extension',
      order: 5,
    },
    {
      id: generateExerciseId(),
      name: '30yd Shuttle',
      category: 'Conditioning',
      targetSets: 6,
      targetReps: 1,
      notes: '75% effort. Change of direction speed',
      order: 6,
    },
  ];

  return {
    id: `plan_bigskill_${Date.now()}`,
    userId,
    name: 'Big Skill - Power Balance',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * SKILL POSITIONS (RB, WR, DB, QB) - Speed & Agility Focus
 */
function createSkillPositionPlan(userId: string): UserPlanTemplate {
  const exercises: PlanExercise[] = [
    {
      id: generateExerciseId(),
      name: 'Box Jumps',
      category: 'Plyometrics',
      targetSets: 5,
      targetReps: 5,
      notes: 'Maximum explosiveness. Full extension',
      order: 1,
    },
    {
      id: generateExerciseId(),
      name: 'Hang Clean',
      category: 'Plyometrics',
      targetSets: 4,
      targetReps: 3,
      notes: '60-75% 1RM. Explosive execution',
      order: 2,
    },
    {
      id: generateExerciseId(),
      name: 'Front Squat',
      category: 'Strength',
      targetSets: 4,
      targetReps: 6,
      notes: '60-75% 1RM. Speed emphasis',
      order: 3,
    },
    {
      id: generateExerciseId(),
      name: 'Reaction Sprints',
      category: 'Speed',
      targetSets: 8,
      targetReps: 1,
      notes: 'React to coach clap/hand signal. 20-40yd',
      order: 4,
    },
    {
      id: generateExerciseId(),
      name: 'Lateral Bounds',
      category: 'Plyometrics',
      targetSets: 4,
      targetReps: 10,
      notes: 'Elastic, quick ground contact',
      order: 5,
    },
    {
      id: generateExerciseId(),
      name: '40yd Sprints',
      category: 'Speed',
      targetSets: 6,
      targetReps: 1,
      notes: 'Maximum effort. Full recovery between reps',
      order: 6,
    },
  ];

  return {
    id: `plan_skill_${Date.now()}`,
    userId,
    name: 'Skill Positions - Speed Focus',
    exercises,
    warmupMinutes: 10,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    timesCompleted: 0,
  };
}

/**
 * Get recommended plans based on player position
 */
export function getRecommendedPlansForPosition(position: Position, userId: string): UserPlanTemplate[] {
  const basePlans = [
    createMondayLowerBodyPlan(userId),
    createTuesdaySpeedAgilityPlan(userId),
    createWednesdayUpperBodyPlan(userId),
    createThursdayPlyoConditioningPlan(userId),
    createFridayFullBodyPlan(userId),
  ];

  // Add position-specific plan
  let positionSpecificPlan: UserPlanTemplate;

  // Linemen
  if (['OL', 'DL'].includes(position)) {
    positionSpecificPlan = createLinemenSpecialPlan(userId);
  }
  // Big Skill
  else if (['LB', 'TE'].includes(position)) {
    positionSpecificPlan = createBigSkillPlan(userId);
  }
  // Skill Positions
  else {
    positionSpecificPlan = createSkillPositionPlan(userId);
  }

  return [...basePlans, positionSpecificPlan];
}

/**
 * Initialize default workout plans for a user based on their position
 */
export function initializeDefaultWorkoutPlans(userId: string, position: Position): void {
  const plans = getRecommendedPlansForPosition(position, userId);

  // Get existing plans
  const existingPlansKey = `user_plans_${userId}`;
  const stored = localStorage.getItem(existingPlansKey);
  const existingPlans: UserPlanTemplate[] = stored ? JSON.parse(stored) : [];

  // Only add if user has no plans yet
  if (existingPlans.length === 0) {
    localStorage.setItem(existingPlansKey, JSON.stringify(plans));
    console.log(`✅ Initialized ${plans.length} workout plans for user ${userId} (${position})`);
  }
}

/**
 * Initialize default workout plans for ALL players (Coach function)
 * This allows coaches to bulk-initialize plans for all team members
 */
export function initializeDefaultWorkoutPlansForAllPlayers(): number {
  const usersKey = 'rhinos_users';
  const stored = localStorage.getItem(usersKey);

  if (!stored) {
    console.log('No users found');
    return 0;
  }

  const allUsers = JSON.parse(stored);
  const players = allUsers.filter((u: any) => u.role === 'player');

  let initializedCount = 0;

  players.forEach((player: any) => {
    const existingPlansKey = `user_plans_${player.id}`;
    const existingStored = localStorage.getItem(existingPlansKey);
    const existingPlans: UserPlanTemplate[] = existingStored ? JSON.parse(existingStored) : [];

    // Only initialize if player has no plans
    if (existingPlans.length === 0) {
      const plans = getRecommendedPlansForPosition(player.position, player.id);
      localStorage.setItem(existingPlansKey, JSON.stringify(plans));
      initializedCount++;
      console.log(`✅ Initialized ${plans.length} plans for ${player.name} (${player.position})`);
    }
  });

  return initializedCount;
}
