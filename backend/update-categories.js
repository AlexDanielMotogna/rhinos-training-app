/**
 * Script para actualizar categorías de usuarios existentes
 * Ejecutar con: node update-categories.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function updateUserCategories() {
  try {
    console.log('🔄 Actualizando categorías de usuarios existentes...\n');

    // Obtener todos los usuarios sin ageCategory
    const playersWithoutCategory = await prisma.user.findMany({
      where: {
        role: 'player',
        ageCategory: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
      },
    });

    // Obtener todos los coaches y filtrar los que no tienen categorías
    const allCoaches = await prisma.user.findMany({
      where: {
        role: 'coach',
      },
      select: {
        id: true,
        name: true,
        email: true,
        coachCategories: true,
      },
    });

    const coachesWithoutCategory = allCoaches.filter(
      coach => !coach.coachCategories || coach.coachCategories.length === 0
    );

    console.log(`📊 Encontrados:`);
    console.log(`   - ${playersWithoutCategory.length} jugadores sin categoría`);
    console.log(`   - ${coachesWithoutCategory.length} entrenadores sin categoría\n`);

    if (playersWithoutCategory.length === 0 && coachesWithoutCategory.length === 0) {
      console.log('✅ Todos los usuarios ya tienen categorías asignadas');
      return;
    }

    // Actualizar jugadores
    // Por defecto asignar a Kampfmannschaft (equipo principal)
    // Si prefieres Jugend, cambia 'Kampfmannschaft' por 'Jugend'
    for (const player of playersWithoutCategory) {
      // Lógica: Si el jugador tiene menos de 18 años → Jugend, sino → Kampfmannschaft
      const category = player.age && player.age < 18 ? 'Jugend' : 'Kampfmannschaft';

      await prisma.user.update({
        where: { id: player.id },
        data: { ageCategory: category },
      });

      console.log(`✅ ${player.name} (${player.email}) → ${category}`);
    }

    // Actualizar coaches
    // Por defecto asignar ambas categorías a los coaches
    for (const coach of coachesWithoutCategory) {
      await prisma.user.update({
        where: { id: coach.id },
        data: { coachCategories: ['Kampfmannschaft', 'Jugend'] },
      });

      console.log(`✅ ${coach.name} (${coach.email}) → Coach de ambas categorías`);
    }

    console.log(`\n✅ Actualización completada!`);
    console.log(`   - ${playersWithoutCategory.length} jugadores actualizados`);
    console.log(`   - ${coachesWithoutCategory.length} entrenadores actualizados`);

  } catch (error) {
    console.error('❌ Error al actualizar categorías:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
updateUserCategories()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
