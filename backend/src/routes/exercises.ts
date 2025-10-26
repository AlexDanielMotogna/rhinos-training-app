import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const exerciseSchema = z.object({
  name: z.string().min(1),
  category: z.enum(['Strength', 'Speed', 'COD', 'Mobility', 'Technique', 'Conditioning', 'Recovery', 'Plyometrics']),
  youtubeUrl: z.string().url().optional().or(z.literal('')),
  positionTags: z.array(z.string()).optional().default([]),
  intensity: z.enum(['low', 'mod', 'high']).optional(),
  isGlobal: z.boolean().optional().default(true),
  isCustom: z.boolean().optional().default(false),
  descriptionEN: z.string().optional(),
  descriptionDE: z.string().optional(),
});

// GET /api/exercises - Get all exercises
router.get('/', authenticate, async (req, res) => {
  try {
    const exercises = await prisma.exercise.findMany({
      orderBy: [
        { isGlobal: 'desc' },
        { name: 'asc' },
      ],
    });

    res.json(exercises);
  } catch (error) {
    console.error('Get exercises error:', error);
    res.status(500).json({ error: 'Failed to fetch exercises' });
  }
});

// GET /api/exercises/:id - Get single exercise
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const exercise = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!exercise) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    res.json(exercise);
  } catch (error) {
    console.error('Get exercise error:', error);
    res.status(500).json({ error: 'Failed to fetch exercise' });
  }
});

// POST /api/exercises - Create new exercise (Coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create exercises' });
    }

    const data = exerciseSchema.parse(req.body);

    // Check if exercise with same name already exists
    const existing = await prisma.exercise.findUnique({
      where: { name: data.name },
    });

    if (existing) {
      return res.status(400).json({ error: 'An exercise with this name already exists' });
    }

    const exercise = await prisma.exercise.create({
      data: {
        ...data,
        youtubeUrl: data.youtubeUrl || null,
        createdBy: req.user.userId,
      },
    });

    res.status(201).json(exercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create exercise error:', error);
    res.status(500).json({ error: 'Failed to create exercise' });
  }
});

// PATCH /api/exercises/:id - Update exercise (Coach only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update exercises' });
    }

    const { id } = req.params;
    const data = exerciseSchema.partial().parse(req.body);

    // Check if exercise exists
    const existing = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    // If updating name, check for duplicates
    if (data.name && data.name !== existing.name) {
      const duplicate = await prisma.exercise.findUnique({
        where: { name: data.name },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'An exercise with this name already exists' });
      }
    }

    const exercise = await prisma.exercise.update({
      where: { id },
      data: {
        ...data,
        youtubeUrl: data.youtubeUrl === '' ? null : data.youtubeUrl,
      },
    });

    res.json(exercise);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update exercise error:', error);
    res.status(500).json({ error: 'Failed to update exercise' });
  }
});

// DELETE /api/exercises/:id - Delete exercise (Coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete exercises' });
    }

    const { id } = req.params;

    // Check if exercise exists
    const existing = await prisma.exercise.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Exercise not found' });
    }

    await prisma.exercise.delete({
      where: { id },
    });

    res.json({ message: 'Exercise deleted successfully' });
  } catch (error) {
    console.error('Delete exercise error:', error);
    res.status(500).json({ error: 'Failed to delete exercise' });
  }
});

export default router;
