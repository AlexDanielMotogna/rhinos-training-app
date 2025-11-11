import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const runVideoUpdates = [
  {
    title: 'Inside Zone Run Blocking and Reads',
    positions: ['RB', 'OL', 'QB'],
  },
  {
    title: 'Outside Zone Stretch Concept',
    positions: ['RB', 'OL', 'QB'],
  },
  {
    title: 'Power Run Blocking Scheme',
    positions: ['RB', 'OL', 'TE'],
  },
  {
    title: 'Counter Run Play Execution',
    positions: ['RB', 'OL', 'QB'],
  },
  {
    title: 'Trap Block Fundamentals',
    positions: ['RB', 'OL', 'QB'],
  },
  {
    title: 'Toss Sweep to the Edge',
    positions: ['RB', 'OL', 'QB'],
  },
  {
    title: 'Draw Play Timing and Execution',
    positions: ['RB', 'OL', 'QB'],
  },
  {
    title: 'ISO Lead Blocking Concept',
    positions: ['RB', 'OL'],
  },
];

async function updateRunVideoPositions() {
  console.log('🔄 Updating run video positions...');

  let updated = 0;
  let notFound = 0;

  for (const update of runVideoUpdates) {
    try {
      const video = await prisma.video.findFirst({
        where: { title: update.title },
      });

      if (!video) {
        console.log(`⚠️  Video not found: ${update.title}`);
        notFound++;
        continue;
      }

      await prisma.video.update({
        where: { id: video.id },
        data: {
          positions: update.positions,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Updated: ${update.title} → [${update.positions.join(', ')}]`);
      updated++;
    } catch (error: any) {
      console.error(`❌ Failed to update "${update.title}":`, error.message);
    }
  }

  console.log('\n📊 Update Summary:');
  console.log(`   ✅ Updated: ${updated} videos`);
  console.log(`   ⚠️  Not found: ${notFound} videos`);

  await prisma.$disconnect();
}

updateRunVideoPositions();
