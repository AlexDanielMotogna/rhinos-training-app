import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.trainingTemplate.findMany({
    where: {
      name: { contains: 'Strength', mode: 'insensitive' }
    }
  });

  templates.forEach(template => {
    console.log('\nTemplate:', template.name);
    const blocks = template.blocks as any[];

    blocks.forEach((block: any, blockIdx: number) => {
      console.log(`\n  Block ${blockIdx + 1}: ${block.title}`);
      console.log(`    globalSets: ${block.globalSets}`);
      console.log(`    Has exerciseConfigs: ${!!block.exerciseConfigs}`);

      if (block.exerciseConfigs) {
        console.log(`    exerciseConfigs count: ${block.exerciseConfigs.length}`);
        block.exerciseConfigs.slice(0, 2).forEach((config: any) => {
          console.log(`      - sets: ${config.sets}, reps: ${config.reps}, unit: ${config.unit}`);
        });
      }

      const exercises = block.items || block.exercises || [];
      console.log(`    Total exercises: ${exercises.length}`);
    });
  });

  await prisma.$disconnect();
}

main();
