import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  nameDE: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#1976d2'),
  key: z.string().min(1, 'Category key is required'), // Unique identifier (e.g., "offense", "defense")
});

const updateCategorySchema = z.object({
  name: z.string().min(1).optional(),
  nameDE: z.string().optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  key: z.string().min(1).optional(),
});

// GET /api/drill-categories - Get all categories (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await prisma.drillCategory.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('[DRILL CATEGORIES] Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// POST /api/drill-categories/seed - Seed default categories (coach only)
router.post('/seed', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can seed categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can seed categories' });
    }

    const defaultCategories = [
      {
        name: 'Athletik / Conditioning',
        nameDE: 'Athletik / Konditionierung',
        color: '#FFB300',
      },
      {
        name: 'Fundamentals',
        nameDE: 'Grundlagen',
        color: '#43A047',
      },
      {
        name: 'Offense',
        nameDE: 'Offense',
        color: '#E53935',
      },
      {
        name: 'Defense',
        nameDE: 'Defense',
        color: '#1E88E5',
      },
      {
        name: 'Team',
        nameDE: 'Team',
        color: '#8E24AA',
      },
      {
        name: 'Cool Down',
        nameDE: 'Abkühlung',
        color: '#00ACC1',
      },
    ];

    const created = [];
    const skipped = [];

    for (const category of defaultCategories) {
      const existing = await prisma.drillCategory.findUnique({
        where: { name: category.name },
      });

      if (existing) {
        skipped.push(category.name);
        continue;
      }

      const newCategory = await prisma.drillCategory.create({
        data: {
          name: category.name,
          nameDE: category.nameDE,
          color: category.color,
          createdBy: user.userId,
        },
      });

      created.push(newCategory.name);
    }

    console.log(`[DRILL CATEGORIES] Seeded by ${user.email}: Created ${created.length}, Skipped ${skipped.length}`);
    res.json({
      message: 'Seed completed',
      created,
      skipped,
    });
  } catch (error) {
    console.error('[DRILL CATEGORIES] Seed error:', error);
    res.status(500).json({ error: 'Failed to seed categories' });
  }
});

// GET /api/drill-categories/:id - Get single category (authenticated)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const category = await prisma.drillCategory.findUnique({
      where: { id },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('[DRILL CATEGORIES] Get category error:', error);
    res.status(500).json({ error: 'Failed to fetch category' });
  }
});

// POST /api/drill-categories - Create category (coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can create categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create categories' });
    }

    const validatedData = createCategorySchema.parse(req.body);

    const category = await prisma.drillCategory.create({
      data: {
        ...validatedData,
        createdBy: user.userId,
      },
    });

    console.log(`[DRILL CATEGORIES] Category created: ${category.name} by ${user.email}`);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    console.error('[DRILL CATEGORIES] Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PUT /api/drill-categories/:id - Update category (coach only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can update categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update categories' });
    }

    const validatedData = updateCategorySchema.parse(req.body);

    const category = await prisma.drillCategory.update({
      where: { id },
      data: validatedData,
    });

    console.log(`[DRILL CATEGORIES] Category updated: ${category.name} by ${user.email}`);
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    if ((error as any).code === 'P2002') {
      return res.status(400).json({ error: 'Category name already exists' });
    }
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('[DRILL CATEGORIES] Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/drill-categories/:id - Delete category (coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can delete categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete categories' });
    }

    // Check if category is being used by any drills
    const drillsUsingCategory = await prisma.drill.findFirst({
      where: { category: (await prisma.drillCategory.findUnique({ where: { id } }))?.name || '' },
    });

    if (drillsUsingCategory) {
      return res.status(400).json({
        error: 'Cannot delete category that is being used by drills. Please reassign drills first.'
      });
    }

    await prisma.drillCategory.delete({
      where: { id },
    });

    console.log(`[DRILL CATEGORIES] Category deleted by ${user.email}`);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    if ((error as any).code === 'P2025') {
      return res.status(404).json({ error: 'Category not found' });
    }
    console.error('[DRILL CATEGORIES] Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
