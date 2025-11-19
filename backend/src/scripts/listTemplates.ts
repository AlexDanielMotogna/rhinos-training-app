import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const templates = await prisma.trainingTemplate.findMany();

  console.log(`Found ${templates.length} templates:`);

  templates.forEach(template => {
    console.log(`\nID: ${template.id}`);
    console.log(`Name: ${template.name}`);
    console.log(`Training Type ID: ${template.trainingTypeId}`);

    const blocks = template.blocks as any[];
    console.log(`Blocks: ${blocks ? blocks.length : 0}`);

    if (blocks && blocks.length > 0) {
      const firstBlock = blocks[0];
      console.log(`\nFirst block: ${firstBlock.title}`);
      console.log(`  globalSets: ${firstBlock.globalSets}`);
      console.log(`  Has exerciseConfigs: ${!!firstBlock.exerciseConfigs}`);

      if (!firstBlock.globalSets && !firstBlock.exerciseConfigs) {
        console.log('  ⚠️ WARNING: No globalSets AND no exerciseConfigs!');
      }
    }
  });

  await prisma.$disconnect();
}

main();
