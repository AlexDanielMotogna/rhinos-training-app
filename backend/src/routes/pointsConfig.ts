import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schema
const pointsConfigSchema = z.object({
  weeklyTarget: z.number().min(1).default(20),
  maxDailyPoints: z.number().min(1).optional(),
  categories: z.array(z.any()), // Array of PointCategory - validated on frontend
  colorScale: z.object({
    low: z.string(),
    medium: z.string(),
    high: z.string(),
  }),
  updatedBy: z.string().optional(),
});

// GET /api/points-config - Get points configuration
router.get('/', authenticate, async (req, res) => {
  try {
    // Get the latest/first config (should only be one)
    const config = await prisma.pointsConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      // Return default configuration if none exists
      const defaultConfig = {
        weeklyTarget: 20,
        maxDailyPoints: 3,
        categories: [
          {
            id: '1',
            type: 'light',
            nameEN: 'Light Sessions',
            nameDE: 'Leichte Einheiten',
            descriptionEN: 'Gentle mobility or low-intensity activities',
            descriptionDE: 'Sanfte Mobilität oder niedrige Intensität',
            points: 1,
            examplesEN: ['Walking ≥30min', 'Yoga/Mobility ≥20min', 'Light Cycling <30min'],
            examplesDE: ['Spazieren ≥30min', 'Yoga/Mobilität ≥20min', 'Leichtes Radfahren <30min'],
            active: true,
            color: '#90CAF9',
            minDuration: 20,
          },
          {
            id: '2',
            type: 'moderate',
            nameEN: 'Moderate Sessions',
            nameDE: 'Moderate Einheiten',
            descriptionEN: 'Medium intensity activities',
            descriptionDE: 'Aktivitäten mittlerer Intensität',
            points: 2,
            examplesEN: ['Jogging ≥20min', 'Swimming', 'Gym strength <90min', 'Core training'],
            examplesDE: ['Joggen ≥20min', 'Schwimmen', 'Krafttraining <90min', 'Core-Training'],
            active: true,
            color: '#FFB74D',
            minDuration: 20,
          },
          {
            id: '3',
            type: 'team',
            nameEN: 'Team Training',
            nameDE: 'Teamtraining',
            descriptionEN: 'Official team practice sessions',
            descriptionDE: 'Offizielle Team-Trainingseinheiten',
            points: 2.5,
            examplesEN: ['Team practice', 'Team drills', 'Scrimmage'],
            examplesDE: ['Teamtraining', 'Team-Übungen', 'Trainingsspiel'],
            active: true,
            color: '#66BB6A',
          },
          {
            id: '4',
            type: 'intensive',
            nameEN: 'Intensive Sessions',
            nameDE: 'Intensive Einheiten',
            descriptionEN: 'Long and demanding training',
            descriptionDE: 'Lange und anspruchsvolle Einheiten',
            points: 3,
            examplesEN: ['Long run/bike/swim ≥60min', 'Strength training >90min', 'Mountain hiking'],
            examplesDE: ['Ausdauer ≥60min', 'Krafttraining >90min', 'Bergwandern'],
            active: true,
            color: '#EF5350',
            minDuration: 60,
          },
        ],
        colorScale: {
          low: '#ef5350',
          medium: '#ffa726',
          high: '#66bb6a',
        },
      };

      return res.json(defaultConfig);
    }

    res.json(config);
  } catch (error) {
    console.error('Get points config error:', error);
    res.status(500).json({ error: 'Failed to fetch points configuration' });
  }
});

// PUT /api/points-config - Update or create points configuration (Coach only)
router.put('/', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update points configuration' });
    }

    const data = pointsConfigSchema.parse(req.body);

    // Check if config already exists
    const existing = await prisma.pointsConfig.findFirst();

    let config;
    if (existing) {
      // Update existing
      config = await prisma.pointsConfig.update({
        where: { id: existing.id },
        data,
      });
    } else {
      // Create new
      config = await prisma.pointsConfig.create({
        data,
      });
    }

    res.json(config);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update points config error:', error);
    res.status(500).json({ error: 'Failed to update points configuration' });
  }
});

// DELETE /api/points-config - Reset to defaults (Coach only)
router.delete('/', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can reset points configuration' });
    }

    // Delete existing config
    const existing = await prisma.pointsConfig.findFirst();
    if (existing) {
      await prisma.pointsConfig.delete({
        where: { id: existing.id },
      });
    }

    res.json({ message: 'Points configuration reset to defaults' });
  } catch (error) {
    console.error('Reset points config error:', error);
    res.status(500).json({ error: 'Failed to reset points configuration' });
  }
});

export default router;
