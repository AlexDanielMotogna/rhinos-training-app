import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function revertToRhinosBranding() {
  console.log('\n=== Reverting to Rhinos Training Branding ===\n');

  const updated = await prisma.teamSettings.updateMany({
    data: {
      teamName: 'Rhinos',
      appName: 'Rhinos Training',
      primaryColor: '#2e7d32',  // Verde Rhinos
      secondaryColor: '#ff9800',
      logoUrl: 'https://res.cloudinary.com/dchr6mefv/image/upload/v1734028825/rhinos-training/logos/xzjgzrjlpunqe1gw95xi.png',
      faviconUrl: 'https://res.cloudinary.com/dchr6mefv/image/upload/v1734028840/rhinos-training/favicons/izglr55ldmxc7uihdpxm.png'
    }
  });

  console.log(`✓ Updated ${updated.count} team settings record(s)\n`);

  const settings = await prisma.teamSettings.findFirst();
  console.log('Current branding:');
  console.log(`  Team Name: ${settings.teamName}`);
  console.log(`  App Name: ${settings.appName}`);
  console.log(`  Primary Color: ${settings.primaryColor}`);
  console.log(`  Secondary Color: ${settings.secondaryColor}`);
  console.log(`  Logo URL: ${settings.logoUrl}`);
  console.log(`  Favicon URL: ${settings.faviconUrl}`);
  console.log('');

  await prisma.$disconnect();
}

revertToRhinosBranding().catch(console.error);
