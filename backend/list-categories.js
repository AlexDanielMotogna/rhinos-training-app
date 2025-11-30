/**
 * Script para listar las categorías de todos los usuarios
 * Ejecutar con: node list-categories.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function listUserCategories() {
  try {
    console.log('📋 Listando categorías de usuarios...\n');

    // Obtener todos los jugadores
    const players = await prisma.user.findMany({
      where: {
        role: 'player',
      },
      select: {
        name: true,
        email: true,
        ageCategory: true,
        age: true,
      },
      orderBy: {
        ageCategory: 'asc',
      },
    });

    // Obtener todos los coaches
    const coaches = await prisma.user.findMany({
      where: {
        role: 'coach',
      },
      select: {
        name: true,
        email: true,
        coachCategories: true,
      },
    });

    console.log('👥 JUGADORES:');
    console.log('='.repeat(80));

    const kampfmannschaft = players.filter(p => p.ageCategory === 'Kampfmannschaft');
    const jugend = players.filter(p => p.ageCategory === 'Jugend');
    const sinCategoria = players.filter(p => !p.ageCategory);

    console.log('\n🏈 Kampfmannschaft (' + kampfmannschaft.length + '):');
    kampfmannschaft.forEach(p => {
      console.log(`   - ${p.name} (${p.email}) - ${p.age} años`);
    });

    console.log('\n🏈 Jugend (' + jugend.length + '):');
    jugend.forEach(p => {
      console.log(`   - ${p.name} (${p.email}) - ${p.age} años`);
    });

    if (sinCategoria.length > 0) {
      console.log('\n⚠️  Sin categoría (' + sinCategoria.length + '):');
      sinCategoria.forEach(p => {
        console.log(`   - ${p.name} (${p.email}) - ${p.age} años`);
      });
    }

    console.log('\n\n🏋️ ENTRENADORES:');
    console.log('='.repeat(80));
    coaches.forEach(c => {
      const cats = c.coachCategories && c.coachCategories.length > 0
        ? c.coachCategories.join(', ')
        : '⚠️ Sin categorías';
      console.log(`   - ${c.name} (${c.email}) → ${cats}`);
    });

    console.log('\n📊 RESUMEN:');
    console.log('='.repeat(80));
    console.log(`Total jugadores: ${players.length}`);
    console.log(`  - Kampfmannschaft: ${kampfmannschaft.length}`);
    console.log(`  - Jugend: ${jugend.length}`);
    console.log(`  - Sin categoría: ${sinCategoria.length}`);
    console.log(`Total coaches: ${coaches.length}`);

  } catch (error) {
    console.error('❌ Error al listar categorías:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
listUserCategories()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
