import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// GET /api/users/me - Get current user
router.get('/me', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        jerseyNumber: true,
        birthDate: true,
        age: true,
        weightKg: true,
        heightCm: true,
        position: true,
        sex: true,
        phone: true,
        instagram: true,
        snapchat: true,
        tiktok: true,
        hudl: true,
        metricsPublic: true,
        aiCoachEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// GET /api/users - Get all users (for team directory)
router.get('/', authenticate, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jerseyNumber: true,
        position: true,
        age: true,
        weightKg: true,
        heightCm: true,
        sex: true,
        metricsPublic: true,
      },
      orderBy: [
        { role: 'asc' }, // Coaches first
        { name: 'asc' },
      ],
    });

    res.json(users);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        jerseyNumber: true,
        birthDate: true,
        age: true,
        weightKg: true,
        heightCm: true,
        position: true,
        sex: true,
        phone: true,
        instagram: true,
        snapchat: true,
        tiktok: true,
        hudl: true,
        metricsPublic: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user by ID error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// PATCH /api/users/me - Update current user profile
router.patch('/me', authenticate, async (req, res) => {
  try {
    const {
      name,
      jerseyNumber,
      birthDate,
      age,
      weightKg,
      heightCm,
      position,
      sex,
      phone,
      instagram,
      snapchat,
      tiktok,
      hudl,
      metricsPublic,
      aiCoachEnabled,
      aiApiKey,
    } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: req.user!.userId },
      data: {
        ...(name && { name }),
        ...(jerseyNumber !== undefined && { jerseyNumber }),
        ...(birthDate && { birthDate }),
        ...(age !== undefined && { age }),
        ...(weightKg !== undefined && { weightKg }),
        ...(heightCm !== undefined && { heightCm }),
        ...(position && { position }),
        ...(sex && { sex }),
        ...(phone !== undefined && { phone }),
        ...(instagram !== undefined && { instagram }),
        ...(snapchat !== undefined && { snapchat }),
        ...(tiktok !== undefined && { tiktok }),
        ...(hudl !== undefined && { hudl }),
        ...(metricsPublic !== undefined && { metricsPublic }),
        ...(aiCoachEnabled !== undefined && { aiCoachEnabled }),
        ...(aiApiKey !== undefined && { aiApiKey }),
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        jerseyNumber: true,
        birthDate: true,
        age: true,
        weightKg: true,
        heightCm: true,
        position: true,
        sex: true,
        phone: true,
        instagram: true,
        snapchat: true,
        tiktok: true,
        hudl: true,
        metricsPublic: true,
        aiCoachEnabled: true,
      },
    });

    res.json(updatedUser);
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

export default router;
