import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function checkMuscleGroups() {
  console.log('[CHECK] Checking muscle groups in database...');

  try {
    // Get first 5 exercises
    const exercises = await prisma.exercise.findMany({
      take: 5,
      orderBy: { name: 'asc' },
    });

    console.log('\n[CHECK] First 5 exercises:');
    exercises.forEach((ex) => {
      console.log(`- ${ex.name}`);
      console.log(`  Category: ${ex.category}`);
      console.log(`  Muscle Groups: ${JSON.stringify(ex.muscleGroups)}`);
      console.log(`  Muscle Groups length: ${ex.muscleGroups?.length || 0}`);
      console.log('');
    });

    // Count exercises with muscle groups
    const allExercises = await prisma.exercise.findMany();
    const withMuscleGroups = allExercises.filter(ex => ex.muscleGroups && ex.muscleGroups.length > 0);
    const withLegs = allExercises.filter(ex => ex.muscleGroups && ex.muscleGroups.includes('legs'));

    console.log(`[CHECK] Total exercises: ${allExercises.length}`);
    console.log(`[CHECK] Exercises with muscle groups: ${withMuscleGroups.length}`);
    console.log(`[CHECK] Exercises with 'legs': ${withLegs.length}`);

  } catch (error) {
    console.error('[CHECK ERROR]', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMuscleGroups();
