import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Initialize default exercise categories
 * This should be run once when setting up the database
 */
export async function initializeExerciseCategories() {
  const defaultCategories = [
    {
      key: 'strength',
      nameEN: 'Strength',
      nameDE: 'Kraft',
      color: '#d32f2f',
      icon: 'FitnessCenter',
      active: true,
    },
    {
      key: 'speed',
      nameEN: 'Speed',
      nameDE: 'Schnelligkeit',
      color: '#f57c00',
      icon: 'Speed',
      active: true,
    },
    {
      key: 'cod',
      nameEN: 'COD',
      nameDE: 'Richtungswechsel',
      color: '#fbc02d',
      icon: 'TrendingUp',
      active: true,
    },
    {
      key: 'plyometrics',
      nameEN: 'Plyometrics',
      nameDE: 'Plyometrie',
      color: '#388e3c',
      icon: 'Height',
      active: true,
    },
    {
      key: 'mobility',
      nameEN: 'Mobility',
      nameDE: 'Mobilität',
      color: '#ffffffff',
      icon: 'SelfImprovement',
      active: true,
    },
    {
      key: 'technique',
      nameEN: 'Technique',
      nameDE: 'Technik',
      color: '#7b1fa2',
      icon: 'Psychology',
      active: true,
    },
    {
      key: 'conditioning',
      nameEN: 'Conditioning',
      nameDE: 'Konditionierung',
      color: '#0097a7',
      icon: 'DirectionsRun',
      active: true,
    },
    {
      key: 'recovery',
      nameEN: 'Recovery',
      nameDE: 'Regeneration',
      color: '#5d4037',
      icon: 'Spa',
      active: true,
    },
  ];

  console.log('[INIT] Initializing exercise categories...');

  for (const category of defaultCategories) {
    try {
      await prisma.exerciseCategory.upsert({
        where: { key: category.key },
        update: {
          nameEN: category.nameEN,
          nameDE: category.nameDE,
          color: category.color,
          icon: category.icon,
          active: category.active,
        },
        create: {
          ...category,
          createdBy: null, // System category
        },
      });
      console.log(`[INIT] ✓ Category "${category.key}" initialized`);
    } catch (error) {
      console.error(`[INIT] ✗ Failed to initialize category "${category.key}":`, error);
    }
  }

  console.log('[INIT] Exercise categories initialization complete');
}

/**
 * Get all active exercise categories
 */
export async function getActiveExerciseCategories() {
  return await prisma.exerciseCategory.findMany({
    where: { active: true },
    orderBy: { nameEN: 'asc' },
  });
}
