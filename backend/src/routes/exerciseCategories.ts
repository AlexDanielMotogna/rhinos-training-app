import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { initializeExerciseCategories } from '../utils/initExerciseCategories.js';

const router = express.Router();

// Validation schemas
const createCategorySchema = z.object({
  key: z.string().min(1, 'Category key is required').regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores'),
  nameEN: z.string().min(1, 'English name is required'),
  nameDE: z.string().min(1, 'German name is required'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').default('#ffffffff'),
  icon: z.string().optional(),
  active: z.boolean().default(true),
});

const updateCategorySchema = z.object({
  key: z.string().regex(/^[a-z0-9_]+$/, 'Key must be lowercase alphanumeric with underscores').optional(),
  nameEN: z.string().min(1).optional(),
  nameDE: z.string().min(1).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  icon: z.string().optional(),
  active: z.boolean().optional(),
});

// GET /api/exercise-categories - Get all categories (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const categories = await prisma.exerciseCategory.findMany({
      orderBy: { nameEN: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('[EXERCISE CATEGORIES] Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// GET /api/exercise-categories/active - Get only active categories (authenticated)
router.get('/active', authenticate, async (req, res) => {
  try {
    const categories = await prisma.exerciseCategory.findMany({
      where: { active: true },
      orderBy: { nameEN: 'asc' },
    });

    res.json(categories);
  } catch (error) {
    console.error('[EXERCISE CATEGORIES] Get active categories error:', error);
    res.status(500).json({ error: 'Failed to fetch active categories' });
  }
});

// POST /api/exercise-categories/init - Initialize default categories (coach only)
router.post('/init', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can initialize categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can initialize categories' });
    }

    await initializeExerciseCategories();

    const categories = await prisma.exerciseCategory.findMany({
      orderBy: { nameEN: 'asc' },
    });

    res.json({
      message: 'Exercise categories initialized successfully',
      categories,
    });
  } catch (error) {
    console.error('[EXERCISE CATEGORIES] Initialize categories error:', error);
    res.status(500).json({ error: 'Failed to initialize categories' });
  }
});

// POST /api/exercise-categories - Create new category (coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can create categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create categories' });
    }

    const data = createCategorySchema.parse(req.body);

    // Check if key already exists
    const existing = await prisma.exerciseCategory.findUnique({
      where: { key: data.key },
    });

    if (existing) {
      return res.status(400).json({ error: 'Category with this key already exists' });
    }

    const category = await prisma.exerciseCategory.create({
      data: {
        ...data,
        createdBy: user.userId,
      },
    });

    console.log(`[EXERCISE CATEGORIES] Created category "${category.key}" by ${user.email}`);
    res.status(201).json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[EXERCISE CATEGORIES] Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
});

// PATCH /api/exercise-categories/:id - Update category (coach only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can update categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update categories' });
    }

    const { id } = req.params;
    const data = updateCategorySchema.parse(req.body);

    // Check if category exists
    const existing = await prisma.exerciseCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // If updating key, check for duplicates
    if (data.key && data.key !== existing.key) {
      const duplicate = await prisma.exerciseCategory.findUnique({
        where: { key: data.key },
      });

      if (duplicate) {
        return res.status(400).json({ error: 'Category with this key already exists' });
      }
    }

    const category = await prisma.exerciseCategory.update({
      where: { id },
      data,
    });

    console.log(`[EXERCISE CATEGORIES] Updated category "${category.key}" by ${user.email}`);
    res.json(category);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[EXERCISE CATEGORIES] Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE /api/exercise-categories/:id - Delete category (coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can delete categories
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete categories' });
    }

    const { id } = req.params;

    // Check if category exists
    const existing = await prisma.exerciseCategory.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Category not found' });
    }

    // Check if category is being used by any exercises
    const exercisesUsingCategory = await prisma.exercise.count({
      where: { category: existing.key },
    });

    if (exercisesUsingCategory > 0) {
      return res.status(400).json({
        error: 'Cannot delete category',
        message: `This category is being used by ${exercisesUsingCategory} exercise(s). Please reassign or delete those exercises first.`,
      });
    }

    await prisma.exerciseCategory.delete({
      where: { id },
    });

    console.log(`[EXERCISE CATEGORIES] Deleted category "${existing.key}" by ${user.email}`);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('[EXERCISE CATEGORIES] Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

export default router;
