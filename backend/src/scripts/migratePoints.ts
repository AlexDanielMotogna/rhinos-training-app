/**
 * Migration Script: Calculate points for existing WorkoutLogs
 *
 * Run with: npx tsx src/scripts/migratePoints.ts
 */

import prisma from '../utils/prisma.js';
import { calculatePoints } from '../services/points.js';

async function migratePoints() {
  console.log('🔄 Starting points migration...');

  // Get all workout logs
  const workouts = await prisma.workoutLog.findMany({
    select: {
      id: true,
      duration: true,
      source: true,
      entries: true,
      points: true,
      pointsCategory: true,
    },
  });

  console.log(`📊 Found ${workouts.length} workouts to process`);

  let updated = 0;
  let skipped = 0;

  for (const workout of workouts) {
    // Calculate points based on workout data
    const { points, category } = calculatePoints({
      duration: workout.duration || 0,
      source: workout.source,
      entries: (workout.entries as any[]) || [],
    });

    // Update the workout with calculated points
    await prisma.workoutLog.update({
      where: { id: workout.id },
      data: {
        points,
        pointsCategory: category,
      },
    });

    updated++;
    console.log(`  ✓ Workout ${workout.id}: ${points} points (${category})`);
  }

  console.log('');
  console.log('✅ Migration complete!');
  console.log(`   Updated: ${updated} workouts`);
  console.log(`   Skipped: ${skipped} workouts`);
}

migratePoints()
  .catch((error) => {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
