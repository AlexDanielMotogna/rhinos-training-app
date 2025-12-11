import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function checkTests() {
  const userId = '68ffbe1da21f925368a9cce3';

  console.log('\n=== ALL TEST RESULTS ===');
  const allResults = await prisma.testResult.findMany({
    where: { userId },
    orderBy: { dateISO: 'desc' }
  });
  console.log(`Found ${allResults.length} test results`);
  allResults.forEach(r => {
    console.log(`- ${r.testType}: isCurrent=${r.isCurrent}, date=${r.dateISO}`);
  });

  console.log('\n=== CURRENT TEST RESULTS ===');
  const currentResults = await prisma.testResult.findMany({
    where: { userId, isCurrent: true },
    orderBy: { dateISO: 'desc' }
  });
  console.log(`Found ${currentResults.length} current test results`);
  currentResults.forEach(r => {
    console.log(`- ${r.testType}: date=${r.dateISO}`);
  });

  await prisma.$disconnect();
}

checkTests().catch(console.error);
