import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schema
const trainingTypeSchema = z.object({
  key: z.string().min(1),
  nameEN: z.string().min(1),
  nameDE: z.string().min(1),
  season: z.enum(['in-season', 'off-season', 'pre-season']),
  active: z.boolean().optional().default(true),
});

// GET /api/training-types - Get all training types
router.get('/', authenticate, async (req, res) => {
  try {
    const trainingTypes = await prisma.trainingType.findMany({
      orderBy: { createdAt: 'asc' },
    });

    res.json(trainingTypes);
  } catch (error) {
    console.error('Get training types error:', error);
    res.status(500).json({ error: 'Failed to fetch training types' });
  }
});

// GET /api/training-types/:id - Get single training type
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const trainingType = await prisma.trainingType.findUnique({
      where: { id },
    });

    if (!trainingType) {
      return res.status(404).json({ error: 'Training type not found' });
    }

    res.json(trainingType);
  } catch (error) {
    console.error('Get training type error:', error);
    res.status(500).json({ error: 'Failed to fetch training type' });
  }
});

// POST /api/training-types - Create new training type (Coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create training types' });
    }

    const data = trainingTypeSchema.parse(req.body);

    // Check if key already exists
    const existing = await prisma.trainingType.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      return res.status(400).json({ error: 'A training type with this key already exists' });
    }

    const trainingType = await prisma.trainingType.create({
      data,
    });

    res.status(201).json(trainingType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create training type error:', error);
    res.status(500).json({ error: 'Failed to create training type' });
  }
});

// PATCH /api/training-types/:id - Update training type (Coach only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update training types' });
    }

    const { id } = req.params;
    const data = trainingTypeSchema.partial().parse(req.body);

    // Check if training type exists
    const existing = await prisma.trainingType.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Training type not found' });
    }

    // If updating key, check it's not taken
    if (data.key && data.key !== existing.key) {
      const keyTaken = await prisma.trainingType.findUnique({
        where: { key: data.key },
      });

      if (keyTaken) {
        return res.status(400).json({ error: 'A training type with this key already exists' });
      }
    }

    const trainingType = await prisma.trainingType.update({
      where: { id },
      data,
    });

    res.json(trainingType);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update training type error:', error);
    res.status(500).json({ error: 'Failed to update training type' });
  }
});

// DELETE /api/training-types/:id - Delete training type (Coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete training types' });
    }

    const { id } = req.params;

    // Check if training type exists
    const existing = await prisma.trainingType.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Training type not found' });
    }

    await prisma.trainingType.delete({
      where: { id },
    });

    res.json({ message: 'Training type deleted successfully' });
  } catch (error) {
    console.error('Delete training type error:', error);
    res.status(500).json({ error: 'Failed to delete training type' });
  }
});

export default router;
