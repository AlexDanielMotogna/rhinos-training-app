import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate, requireCoach } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createTagSchema = z.object({
  type: z.enum(['position', 'route', 'coverage', 'run']),
  name: z.string().min(1, 'Tag name is required'),
  order: z.number().default(0),
  isDefault: z.boolean().default(false),
});

const updateTagSchema = z.object({
  name: z.string().min(1).optional(),
  order: z.number().optional(),
});

// GET /api/video-tags - Get all tags (optionally filtered by type)
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;

    const where: any = {};
    if (type && typeof type === 'string') {
      where.type = type;
    }

    const tags = await prisma.videoTag.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { name: 'asc' },
      ],
    });

    res.json(tags);
  } catch (error) {
    console.error('[VIDEO-TAGS] Get tags error:', error);
    res.status(500).json({ error: 'Failed to fetch video tags' });
  }
});

// GET /api/video-tags/:id - Get single tag
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const tag = await prisma.videoTag.findUnique({
      where: { id },
    });

    if (!tag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    res.json(tag);
  } catch (error) {
    console.error('[VIDEO-TAGS] Get tag error:', error);
    res.status(500).json({ error: 'Failed to fetch tag' });
  }
});

// POST /api/video-tags - Create tag (coach only)
router.post('/', authenticate, requireCoach, async (req, res) => {
  try {
    const user = (req as any).user;

    const data = createTagSchema.parse(req.body);

    // Check if tag already exists
    const existing = await prisma.videoTag.findUnique({
      where: {
        type_name: {
          type: data.type,
          name: data.name,
        },
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Tag already exists' });
    }

    const tag = await prisma.videoTag.create({
      data: {
        type: data.type,
        name: data.name,
        order: data.order,
        isDefault: data.isDefault,
        createdBy: user.userId,
      },
    });

    console.log(`[VIDEO-TAGS] Tag created: ${tag.name} (${tag.type}) by ${user.email}`);
    res.status(201).json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[VIDEO-TAGS] Create tag error:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// PUT /api/video-tags/:id - Update tag (coach only)
router.put('/:id', authenticate, requireCoach, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if tag exists
    const existingTag = await prisma.videoTag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    const data = updateTagSchema.parse(req.body);

    // If updating name, check for duplicates
    if (data.name && data.name !== existingTag.name) {
      const duplicate = await prisma.videoTag.findUnique({
        where: {
          type_name: {
            type: existingTag.type,
            name: data.name,
          },
        },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Tag name already exists' });
      }
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.order !== undefined) updateData.order = data.order;

    const tag = await prisma.videoTag.update({
      where: { id },
      data: updateData,
    });

    console.log(`[VIDEO-TAGS] Tag updated: ${tag.name} by ${user.email}`);
    res.json(tag);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[VIDEO-TAGS] Update tag error:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// DELETE /api/video-tags/:id - Delete tag (coach only)
router.delete('/:id', authenticate, requireCoach, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Check if tag exists
    const existingTag = await prisma.videoTag.findUnique({
      where: { id },
    });

    if (!existingTag) {
      return res.status(404).json({ error: 'Tag not found' });
    }

    // Prevent deleting default tags
    if (existingTag.isDefault) {
      return res.status(403).json({ error: 'Cannot delete default tags' });
    }

    await prisma.videoTag.delete({
      where: { id },
    });

    console.log(`[VIDEO-TAGS] Tag deleted: ${existingTag.name} by ${user.email}`);
    res.json({ message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('[VIDEO-TAGS] Delete tag error:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

// POST /api/video-tags/initialize - Initialize default tags (coach only)
router.post('/initialize', authenticate, requireCoach, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if tags already initialized
    const existingTags = await prisma.videoTag.count();
    if (existingTags > 0) {
      return res.status(400).json({ error: 'Tags already initialized' });
    }

    // Default positions
    const defaultPositions = [
      'QB', 'RB', 'WR', 'TE', 'OL', 'DL', 'LB', 'DB', 'K/P'
    ];

    // Default routes
    const defaultRoutes = [
      'Slant', 'Out', 'Curl', 'Post', 'Wheel', 'Dig', 'Corner',
      'Comeback', 'Screen', 'Go/Fade', 'Hitch', 'Cross', 'Drag', 'Seam', 'Flag'
    ];

    // Default coverages
    const defaultCoverages = [
      'Cover 0', 'Cover 1', 'Cover 2', 'Cover 3', 'Cover 4', 'Cover 6',
      'Quarters', 'Palms', 'Tampa 2', 'Man', 'Zone', 'Match'
    ];

    // Default run concepts
    const defaultRunConcepts = [
      'Inside Zone', 'Outside Zone', 'Counter', 'Power', 'Trap', 'Stretch',
      'Toss', 'Sweep', 'Draw', 'Iso', 'Wham', 'Dart'
    ];

    const tags = [];

    // Create position tags
    for (let i = 0; i < defaultPositions.length; i++) {
      tags.push({
        type: 'position',
        name: defaultPositions[i],
        order: i,
        isDefault: true,
        createdBy: user.userId,
      });
    }

    // Create route tags
    for (let i = 0; i < defaultRoutes.length; i++) {
      tags.push({
        type: 'route',
        name: defaultRoutes[i],
        order: i,
        isDefault: true,
        createdBy: user.userId,
      });
    }

    // Create coverage tags
    for (let i = 0; i < defaultCoverages.length; i++) {
      tags.push({
        type: 'coverage',
        name: defaultCoverages[i],
        order: i,
        isDefault: true,
        createdBy: user.userId,
      });
    }

    // Create run concept tags
    for (let i = 0; i < defaultRunConcepts.length; i++) {
      tags.push({
        type: 'run',
        name: defaultRunConcepts[i],
        order: i,
        isDefault: true,
        createdBy: user.userId,
      });
    }

    await prisma.videoTag.createMany({
      data: tags,
    });

    console.log(`[VIDEO-TAGS] Initialized ${tags.length} default tags by ${user.email}`);
    res.status(201).json({
      message: 'Default tags initialized successfully',
      count: tags.length
    });
  } catch (error) {
    console.error('[VIDEO-TAGS] Initialize tags error:', error);
    res.status(500).json({ error: 'Failed to initialize tags' });
  }
});

export default router;
