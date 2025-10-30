import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const prisma = new PrismaClient();

const defaultCategories = [
  {
    name: 'Athletik / Conditioning',
    nameDE: 'Athletik / Konditionierung',
    color: '#FFB300',
  },
  {
    name: 'Fundamentals',
    nameDE: 'Grundlagen',
    color: '#43A047',
  },
  {
    name: 'Offense',
    nameDE: 'Offense',
    color: '#E53935',
  },
  {
    name: 'Defense',
    nameDE: 'Defense',
    color: '#1E88E5',
  },
  {
    name: 'Team',
    nameDE: 'Team',
    color: '#8E24AA',
  },
  {
    name: 'Cool Down',
    nameDE: 'Abkühlung',
    color: '#00ACC1',
  },
];

async function seedDrillCategories() {
  console.log('[SEED] Starting drill categories seed...');

  try {
    // Find the first coach user to assign as creator
    const coach = await prisma.user.findFirst({
      where: { role: 'coach' },
    });

    if (!coach) {
      console.error('[SEED ERROR] No coach found in database. Please create a coach user first.');
      return;
    }

    console.log(`[SEED] Using coach ${coach.email} as creator`);

    // Create categories
    for (const category of defaultCategories) {
      const existing = await prisma.drillCategory.findUnique({
        where: { name: category.name },
      });

      if (existing) {
        console.log(`[SEED] Category "${category.name}" already exists, skipping...`);
        continue;
      }

      await prisma.drillCategory.create({
        data: {
          ...category,
          createdBy: coach.id,
        },
      });

      console.log(`[SEED] Created category: ${category.name}`);
    }

    console.log('[SEED] Drill categories seed completed successfully!');
  } catch (error) {
    console.error('[SEED ERROR] Failed to seed drill categories:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedDrillCategories();
