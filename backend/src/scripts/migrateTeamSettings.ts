import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting TeamSettings migration...\n');

  // Get all team settings
  const teamSettings = await prisma.teamSettings.findMany();

  console.log(`Found ${teamSettings.length} TeamSettings records\n`);

  for (const settings of teamSettings) {
    console.log(`Migrating TeamSettings ID: ${settings.id}`);
    console.log(`  Current teamLevel: ${settings.teamLevel}`);

    // Determine updates needed
    const updates: any = {};

    // Update teamLevel if it has old values
    if (settings.teamLevel === 'varsity' || settings.teamLevel === 'jv' || settings.teamLevel === 'elite') {
      // Map old values to new values
      const levelMapping: Record<string, string> = {
        'varsity': 'amateur',
        'jv': 'youth',
        'elite': 'pro',
      };
      updates.teamLevel = levelMapping[settings.teamLevel] || 'amateur';
      console.log(`  ✓ Updating teamLevel: ${settings.teamLevel} → ${updates.teamLevel}`);
    }

    // Add teamCategory if missing (check if field exists)
    const settingsData = settings as any;
    if (!settingsData.teamCategory) {
      updates.teamCategory = 'principal'; // Default to principal (first team)
      console.log(`  ✓ Adding teamCategory: principal (default)`);
    }

    // Apply updates if any
    if (Object.keys(updates).length > 0) {
      await prisma.teamSettings.update({
        where: { id: settings.id },
        data: updates,
      });
      console.log(`  ✅ Updated successfully\n`);
    } else {
      console.log(`  ℹ️  No updates needed\n`);
    }
  }

  console.log('Migration completed successfully!');
}

main()
  .catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
