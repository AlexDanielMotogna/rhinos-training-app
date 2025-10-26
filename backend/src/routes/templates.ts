import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const templateSchema = z.object({
  name: z.string().min(1),
  trainingType: z.string().min(1), // TrainingType ID
  position: z.string().optional().nullable(), // Legacy support
  positions: z.array(z.string()).optional().default([]), // New: multiple positions
  season: z.enum(['in-season', 'off-season', 'pre-season']).optional().default('off-season'),
  durationWeeks: z.number().optional().default(8),
  frequencyPerWeek: z.string().optional().default('2-3'),
  weeklyNotes: z.string().optional().nullable(),
  blocks: z.array(z.any()), // Array of TemplateBlock (validated on frontend)
  isActive: z.boolean().optional().default(true),
});

// GET /api/templates - Get all templates
router.get('/', authenticate, async (req, res) => {
  try {
    const { trainingType, position, season } = req.query;

    const where: any = {};

    if (trainingType) {
      where.trainingType = trainingType;
    }

    if (position) {
      where.position = position;
    }

    if (season) {
      where.season = season;
    }

    const templates = await prisma.trainingTemplate.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    // Get all training types to enrich templates
    const trainingTypes = await prisma.trainingType.findMany();
    const typeMap = new Map(trainingTypes.map(tt => [tt.id, tt]));

    // Transform templates to match frontend expectations
    const enrichedTemplates = templates.map(template => {
      const trainingType = typeMap.get(template.trainingType);

      // Use new positions array, fallback to legacy position field, then default
      let positions = template.positions && template.positions.length > 0
        ? template.positions
        : template.position
          ? [template.position]
          : ['RB'];

      return {
        id: template.id,
        trainingTypeId: template.trainingType,
        trainingTypeName: trainingType?.nameEN || 'Unknown',
        positions,
        blocks: template.blocks,
        durationWeeks: template.durationWeeks || 8,
        frequencyPerWeek: template.frequencyPerWeek || '2-3',
        weeklyNotes: template.weeklyNotes || '',
        active: template.isActive,
        createdAt: template.createdAt,
        updatedAt: template.updatedAt,
      };
    });

    res.json(enrichedTemplates);
  } catch (error) {
    console.error('Get templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

// GET /api/templates/:id - Get single template
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const template = await prisma.trainingTemplate.findUnique({
      where: { id },
      include: {
        assignments: true,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Get template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

// POST /api/templates - Create new template (Coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create templates' });
    }

    const data = templateSchema.parse(req.body);

    const template = await prisma.trainingTemplate.create({
      data: {
        ...data,
        createdBy: req.user.userId,
      },
    });

    // Enrich with training type name
    const trainingType = await prisma.trainingType.findUnique({
      where: { id: template.trainingType },
    });

    const enriched = {
      id: template.id,
      trainingTypeId: template.trainingType,
      trainingTypeName: trainingType?.nameEN || 'Unknown',
      positions: template.positions && template.positions.length > 0
        ? template.positions
        : template.position
          ? [template.position]
          : ['RB'],
      blocks: template.blocks,
      durationWeeks: template.durationWeeks || 8,
      frequencyPerWeek: template.frequencyPerWeek || '2-3',
      weeklyNotes: template.weeklyNotes || '',
      active: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    res.status(201).json(enriched);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create template error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

// PATCH /api/templates/:id - Update template (Coach only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update templates' });
    }

    const { id } = req.params;
    const data = templateSchema.partial().parse(req.body);

    // Check if template exists
    const existing = await prisma.trainingTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    const template = await prisma.trainingTemplate.update({
      where: { id },
      data,
    });

    // Enrich with training type name
    const trainingType = await prisma.trainingType.findUnique({
      where: { id: template.trainingType },
    });

    const enriched = {
      id: template.id,
      trainingTypeId: template.trainingType,
      trainingTypeName: trainingType?.nameEN || 'Unknown',
      positions: template.positions && template.positions.length > 0
        ? template.positions
        : template.position
          ? [template.position]
          : ['RB'],
      blocks: template.blocks,
      durationWeeks: template.durationWeeks || 8,
      frequencyPerWeek: template.frequencyPerWeek || '2-3',
      weeklyNotes: template.weeklyNotes || '',
      active: template.isActive,
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    };

    res.json(enriched);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update template error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

// DELETE /api/templates/:id - Delete template (Coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    // Check if user is coach
    if (req.user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete templates' });
    }

    const { id } = req.params;

    // Check if template exists
    const existing = await prisma.trainingTemplate.findUnique({
      where: { id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // This will also delete all assignments (cascade)
    await prisma.trainingTemplate.delete({
      where: { id },
    });

    res.json({ message: 'Template deleted successfully' });
  } catch (error) {
    console.error('Delete template error:', error);
    res.status(500).json({ error: 'Failed to delete template' });
  }
});

export default router;
