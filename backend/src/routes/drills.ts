import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadDrillSketch, deleteImage } from '../utils/cloudinary.js';

const router = express.Router();

// Validation schemas
const createDrillSchema = z.object({
  name: z.string().min(1, 'Drill name is required'),
  category: z.enum(['athletik', 'fundamentals', 'offense', 'defense', 'team', 'cooldown']),
  description: z.string().min(1, 'Description is required'),
  coachingPoints: z.string().min(1, 'Coaching points are required'),
  players: z.number().min(0).default(0),
  coaches: z.number().min(0).default(0),
  dummies: z.number().min(0).default(0),
  equipment: z.array(z.object({
    equipmentId: z.string(),
    quantity: z.number().min(1),
  })).default([]),
  difficulty: z.enum(['basic', 'advanced', 'complex']),
  trainingContext: z.string().optional(),
  sketchUrl: z.string().optional(),
  sketchPublicId: z.string().optional(),
});

const updateDrillSchema = z.object({
  name: z.string().min(1).optional(),
  category: z.enum(['athletik', 'fundamentals', 'offense', 'defense', 'team', 'cooldown']).optional(),
  description: z.string().min(1).optional(),
  coachingPoints: z.string().min(1).optional(),
  players: z.number().min(0).optional(),
  coaches: z.number().min(0).optional(),
  dummies: z.number().min(0).optional(),
  equipment: z.array(z.object({
    equipmentId: z.string(),
    quantity: z.number().min(1),
  })).optional(),
  difficulty: z.enum(['basic', 'advanced', 'complex']).optional(),
  trainingContext: z.string().optional(),
  sketchUrl: z.string().optional(),
  sketchPublicId: z.string().optional(),
});

// GET /api/drills - Get all drills (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const { category, difficulty } = req.query;

    const where: any = {};
    if (category && typeof category === 'string') {
      where.category = category;
    }
    if (difficulty && typeof difficulty === 'string') {
      where.difficulty = difficulty;
    }

    const drills = await prisma.drill.findMany({
      where,
      orderBy: [
        { category: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(drills);
  } catch (error) {
    console.error('[DRILLS] Get drills error:', error);
    res.status(500).json({ error: 'Failed to fetch drills' });
  }
});

// GET /api/drills/:id - Get single drill (authenticated)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const drill = await prisma.drill.findUnique({
      where: { id },
    });

    if (!drill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    res.json(drill);
  } catch (error) {
    console.error('[DRILLS] Get drill error:', error);
    res.status(500).json({ error: 'Failed to fetch drill' });
  }
});

// POST /api/drills - Create drill (coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can create drills
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create drills' });
    }

    const data = createDrillSchema.parse(req.body);

    const drill = await prisma.drill.create({
      data: {
        name: data.name,
        category: data.category,
        description: data.description,
        coachingPoints: data.coachingPoints,
        players: data.players,
        coaches: data.coaches,
        dummies: data.dummies,
        equipment: data.equipment,
        difficulty: data.difficulty,
        trainingContext: data.trainingContext,
        sketchUrl: data.sketchUrl,
        sketchPublicId: data.sketchPublicId,
        createdBy: user.userId,
      },
    });

    console.log(`[DRILLS] Drill created: ${drill.name} by ${user.email}`);
    res.status(201).json(drill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[DRILLS] Create drill error:', error);
    res.status(500).json({ error: 'Failed to create drill' });
  }
});

// PUT /api/drills/:id - Update drill (coach only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can update drills
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update drills' });
    }

    // Check if drill exists
    const existingDrill = await prisma.drill.findUnique({
      where: { id },
    });

    if (!existingDrill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    const data = updateDrillSchema.parse(req.body);

    const drill = await prisma.drill.update({
      where: { id },
      data,
    });

    console.log(`[DRILLS] Drill updated: ${drill.name} by ${user.email}`);
    res.json(drill);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[DRILLS] Update drill error:', error);
    res.status(500).json({ error: 'Failed to update drill' });
  }
});

// DELETE /api/drills/:id - Delete drill (coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can delete drills
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete drills' });
    }

    // Check if drill exists
    const existingDrill = await prisma.drill.findUnique({
      where: { id },
    });

    if (!existingDrill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    // Delete sketch from Cloudinary if exists
    if (existingDrill.sketchPublicId) {
      try {
        await deleteImage(existingDrill.sketchPublicId as string);
      } catch (error) {
        console.warn('[DRILLS] Failed to delete sketch from Cloudinary:', error);
      }
    }

    await prisma.drill.delete({
      where: { id },
    });

    console.log(`[DRILLS] Drill deleted: ${existingDrill.name} by ${user.email}`);
    res.json({ message: 'Drill deleted successfully' });
  } catch (error) {
    console.error('[DRILLS] Delete drill error:', error);
    res.status(500).json({ error: 'Failed to delete drill' });
  }
});

// POST /api/drills/:id/upload-sketch - Upload drill sketch (coach only)
router.post('/:id/upload-sketch', authenticate, upload.single('sketch'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can upload drill sketches
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can upload drill sketches' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if drill exists
    const existingDrill = await prisma.drill.findUnique({
      where: { id },
    });

    if (!existingDrill) {
      return res.status(404).json({ error: 'Drill not found' });
    }

    // Delete old sketch if exists
    if (existingDrill.sketchPublicId) {
      try {
        await deleteImage(existingDrill.sketchPublicId as string);
      } catch (error) {
        console.warn('[DRILLS] Failed to delete old sketch:', error);
      }
    }

    // Upload new sketch
    const { url, publicId } = await uploadDrillSketch(req.file.buffer, id);

    // Update drill with new sketch URL
    const updatedDrill = await prisma.drill.update({
      where: { id },
      data: {
        sketchUrl: url,
        sketchPublicId: publicId,
      },
    });

    console.log(`[DRILLS] Sketch uploaded for drill: ${updatedDrill.name} by ${user.email}`);
    res.json({
      sketchUrl: url,
      sketchPublicId: publicId,
      drill: updatedDrill,
    });
  } catch (error) {
    console.error('[DRILLS] Upload sketch error:', error);
    res.status(500).json({ error: 'Failed to upload sketch' });
  }
});

export default router;
