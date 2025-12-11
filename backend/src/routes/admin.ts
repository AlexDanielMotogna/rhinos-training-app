import express from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../utils/prisma.js';
import { authenticate, requireCoach } from '../middleware/auth.js';

const router = express.Router();

// POST /api/admin/populate-users - Poblar usuarios mock en la DB (Coach only)
router.post('/populate-users', authenticate, requireCoach, async (req, res) => {
  try {
    console.log('[ADMIN] Starting user population...');
    
    // Hash por defecto para las contraseñas
    const defaultPassword = await bcrypt.hash('password123', 10);
    
    // Usuarios mock que deben existir en la DB
    const mockUsers = [
      {
        id: "68fc2bd5695da1f30c5c237b", // Alex Daniel Motogna
        email: "alex@rhinos.com",
        name: "Alex Daniel Motogna",
        role: "player",
        position: "RB",
        jerseyNumber: 24,
        age: 25,
        weightKg: 85,
        heightCm: 180,
        sex: "male"
      },
      {
        id: "68fcdcb7e3ca4fd116b1392d", // Coach Rhinos
        email: "coach@rhinos.com", 
        name: "Coach Rhinos",
        role: "coach",
        position: null
      },
      {
        id: "player2_id",
        email: "player2@rhinos.com",
        name: "Player Two",
        role: "player", 
        position: "QB",
        jerseyNumber: 12,
        age: 23,
        weightKg: 90,
        heightCm: 185,
        sex: "male"
      },
      {
        id: "player3_id", 
        email: "player3@rhinos.com",
        name: "Player Three",
        role: "player",
        position: "WR", 
        jerseyNumber: 15,
        age: 24,
        weightKg: 75,
        heightCm: 175,
        sex: "male"
      },
      {
        id: "player4_id",
        email: "player4@rhinos.com", 
        name: "Player Four",
        role: "player",
        position: "LB",
        jerseyNumber: 55,
        age: 26,
        weightKg: 95,
        heightCm: 190,
        sex: "male"
      },
      {
        id: "player5_id",
        email: "player5@rhinos.com",
        name: "Player Five", 
        role: "player",
        position: "DB",
        jerseyNumber: 21,
        age: 22,
        weightKg: 80,
        heightCm: 178,
        sex: "male"
      }
    ];
    
    const results = [];
    
    for (const userData of mockUsers) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({
          where: { id: userData.id }
        });
        
        if (existingUser) {
          console.log(`[ADMIN] User ${userData.name} already exists, updating...`);
          await prisma.user.update({
            where: { id: userData.id },
            data: {
              name: userData.name,
              role: userData.role,
              position: userData.position,
              jerseyNumber: userData.jerseyNumber,
              age: userData.age,
              weightKg: userData.weightKg,
              heightCm: userData.heightCm,
              sex: userData.sex
            }
          });
          results.push({ action: 'updated', user: userData.name });
        } else {
          console.log(`[ADMIN] Creating new user: ${userData.name}`);
          await prisma.user.create({
            data: {
              id: userData.id,
              email: userData.email,
              passwordHash: defaultPassword,
              name: userData.name,
              role: userData.role,
              position: userData.position,
              jerseyNumber: userData.jerseyNumber,
              birthDate: userData.age ? new Date(new Date().getFullYear() - userData.age, 0, 1).toISOString() : null,
              age: userData.age,
              weightKg: userData.weightKg,
              heightCm: userData.heightCm,
              sex: userData.sex
            }
          });
          results.push({ action: 'created', user: userData.name });
        }
      } catch (error) {
        console.error(`[ADMIN] Error processing user ${userData.name}:`, error);
        results.push({ action: 'error', user: userData.name, error: error.message });
      }
    }
    
    // Mostrar resumen
    const totalUsers = await prisma.user.count();
    const players = await prisma.user.count({ where: { role: 'player' } });
    const coaches = await prisma.user.count({ where: { role: 'coach' } });
    
    console.log('[ADMIN] User population completed!');
    
    res.json({
      success: true,
      message: 'Users populated successfully',
      results,
      summary: {
        totalUsers,
        players,
        coaches
      }
    });
    
  } catch (error) {
    console.error('[ADMIN] Population error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to populate users',
      details: error.message 
    });
  }
});

export default router;