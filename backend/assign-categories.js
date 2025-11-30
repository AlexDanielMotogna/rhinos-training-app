/**
 * Script para asignar categorías a TODOS los jugadores existentes
 * Ejecutar con: node assign-categories.js
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignCategories() {
  try {
    console.log('🔄 Asignando categorías a jugadores...\n');

    // Obtener TODOS los jugadores
    const allPlayers = await prisma.user.findMany({
      where: {
        role: 'player',
      },
      select: {
        id: true,
        name: true,
        email: true,
        age: true,
        ageCategory: true,
      },
    });

    console.log(`📊 Total jugadores: ${allPlayers.length}\n`);

    let updated = 0;

    for (const player of allPlayers) {
      // Determinar categoría basado en edad
      // Jugend: menores de 18 años
      // Kampfmannschaft: 18 años o más
      const category = player.age && player.age < 18 ? 'Jugend' : 'Kampfmannschaft';

      await prisma.user.update({
        where: { id: player.id },
        data: { ageCategory: category },
      });

      const wasUpdated = player.ageCategory !== category;
      const status = wasUpdated ? '🆕' : '✓';
      console.log(`${status} ${player.name} (${player.age} años) → ${category}`);

      if (wasUpdated) updated++;
    }

    console.log(`\n✅ Proceso completado!`);
    console.log(`   - Total jugadores: ${allPlayers.length}`);
    console.log(`   - Actualizados: ${updated}`);
    console.log(`   - Sin cambios: ${allPlayers.length - updated}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Ejecutar
assignCategories()
  .catch((error) => {
    console.error('Error fatal:', error);
    process.exit(1);
  });
