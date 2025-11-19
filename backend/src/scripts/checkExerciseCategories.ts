import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.trainingTemplate.findMany();

  console.log('\nExercise categories found in templates:');
  const categoriesSet = new Set<string>();

  templates.forEach(template => {
    const blocks = template.blocks as any[];
    blocks.forEach((block: any) => {
      const exercises = block.items || block.exercises || [];
      exercises.forEach((exercise: any) => {
        if (exercise.category) {
          categoriesSet.add(exercise.category);
        }
      });
    });
  });

  console.log('\nUnique categories:', Array.from(categoriesSet));

  // Now check some specific exercises
  const exercises = await prisma.exercise.findMany({
    take: 10
  });

  console.log('\n\nSample exercises from database:');
  exercises.slice(0, 5).forEach(ex => {
    console.log(`- ${ex.name}: category = "${ex.category}"`);
  });

  await prisma.$disconnect();
}

main();
