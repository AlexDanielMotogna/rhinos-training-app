import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { createNotificationsForUsers } from './notifications.js';

const router = express.Router();

// Validation schemas
const assignmentSchema = z.object({
  templateId: z.string(),
  playerIds: z.array(z.string()), // Array of player IDs
  startDate: z.string(), // ISO date
  endDate: z.string().optional().nullable(),
  active: z.boolean().optional().default(true),
});

// GET /api/assignments - Get assignments (filtered by user role and category)
router.get('/', authenticate, async (req, res) => {
  try {
    const { playerId, templateId } = req.query;
    const user = (req as any).user;

    // Get user's category info for filtering
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    });

    let assignments = await prisma.trainingAssignment.findMany({
      include: {
        template: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter based on role and query params
    if (user.role === 'player') {
      // Players only see their own assignments
      assignments = assignments.filter(a => a.playerIds.includes(user.userId));
    } else if (user.role === 'coach') {
      // Coaches filter by their categories (template's ageCategories)
      if (dbUser?.coachCategories && dbUser.coachCategories.length > 0) {
        assignments = assignments.filter(a => {
          const templateCategories = (a.template as any).ageCategories || [];
          return templateCategories.length === 0 ||
            templateCategories.some((cat: string) => dbUser.coachCategories!.includes(cat));
        });
      }
      // Additional filters for coaches
      if (playerId) {
        assignments = assignments.filter(a => a.playerIds.includes(playerId as string));
      }
      if (templateId) {
        assignments = assignments.filter(a => a.templateId === templateId);
      }
    }

    // Enrich templates with trainingTypeName
    const trainingTypes = await prisma.trainingType.findMany();
    const typeMap = new Map(trainingTypes.map(tt => [tt.id, tt]));

    const enrichedAssignments = assignments.map(assignment => {
      const trainingType = typeMap.get(assignment.template.trainingType);

      return {
        ...assignment,
        template: {
          id: assignment.template.id,
          trainingTypeId: assignment.template.trainingType,
          trainingTypeName: trainingType?.nameEN || 'Unknown',
          positions: assignment.template.positions && assignment.template.positions.length > 0
            ? assignment.template.positions
            : assignment.template.position
              ? [assignment.template.position]
              : ['RB'],
          blocks: assignment.template.blocks,
          durationWeeks: assignment.template.durationWeeks || 8,
          frequencyPerWeek: assignment.template.frequencyPerWeek || '2-3',
          weeklyNotes: assignment.template.weeklyNotes || '',
          active: assignment.template.isActive,
          createdAt: assignment.template.createdAt,
          updatedAt: assignment.template.updatedAt,
        }
      };
    });

    res.json(enrichedAssignments);
  } catch (error) {
    console.error('Get assignments error:', error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// GET /api/assignments/:id - Get single assignment
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    const user = (req as any).user;

    const assignment = await prisma.trainingAssignment.findUnique({
      where: { id },
      include: {
        template: true,
      },
    });

    if (!assignment) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Players can only view their own assignments
    if (user.role === 'player' && !assignment.playerIds.includes(user.userId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Coaches can only view assignments in their categories
    if (user.role === 'coach') {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.userId },
        select: { coachCategories: true },
      });
      if (dbUser?.coachCategories && dbUser.coachCategories.length > 0) {
        const templateCategories = (assignment.template as any).ageCategories || [];
        if (templateCategories.length > 0 &&
            !templateCategories.some((cat: string) => dbUser.coachCategories!.includes(cat))) {
          return res.status(403).json({ error: 'Access denied' });
        }
      }
    }

    res.json(assignment);
  } catch (error) {
    console.error('Get assignment error:', error);
    res.status(500).json({ error: 'Failed to fetch assignment' });
  }
});

// POST /api/assignments - Create new assignment (Coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if user is coach
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create assignments' });
    }

    const data = assignmentSchema.parse(req.body);

    // Get coach's categories
    const coach = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { coachCategories: true },
    });

    // Check if template exists
    const template = await prisma.trainingTemplate.findUnique({
      where: { id: data.templateId },
    });

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Verify coach can access this template (template is in their categories)
    if (coach?.coachCategories && coach.coachCategories.length > 0) {
      const templateCategories = (template as any).ageCategories || [];
      if (templateCategories.length > 0 &&
          !templateCategories.some((cat: string) => coach.coachCategories!.includes(cat))) {
        return res.status(403).json({ error: 'Cannot assign template outside your categories' });
      }
    }

    // Validate all players exist and are players
    const players = await prisma.user.findMany({
      where: {
        id: { in: data.playerIds },
      },
    });

    if (players.length !== data.playerIds.length) {
      return res.status(404).json({ error: 'One or more players not found' });
    }

    const nonPlayers = players.filter(p => p.role !== 'player');
    if (nonPlayers.length > 0) {
      return res.status(400).json({ error: 'Can only assign templates to players' });
    }

    // Verify all players are in the coach's categories
    if (coach?.coachCategories && coach.coachCategories.length > 0) {
      const invalidPlayers = players.filter(p =>
        p.ageCategory && !coach.coachCategories!.includes(p.ageCategory)
      );
      if (invalidPlayers.length > 0) {
        return res.status(403).json({ error: 'Cannot assign to players outside your categories' });
      }
    }

    const assignment = await prisma.trainingAssignment.create({
      data: {
        templateId: data.templateId,
        playerIds: data.playerIds,
        startDate: data.startDate,
        endDate: data.endDate,
        active: data.active,
        assignedBy: user.userId,
      },
      include: {
        template: true,
      },
    });

    // Send notifications to assigned players
    if (data.playerIds.length > 0) {
      const title = 'Nuevo plan de entrenamiento';
      const message = `El coach te ha asignado el plan: ${template.name}`;

      await createNotificationsForUsers(
        data.playerIds,
        'new_plan',
        title,
        message,
        '/training',
        assignment.id
      );
    }

    res.status(201).json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create assignment error:', error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// PATCH /api/assignments/:id - Update assignment (Coach only)
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if user is coach
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update assignments' });
    }

    const { id } = req.params;
    const data = assignmentSchema.partial().parse(req.body);

    // Check if assignment exists
    const existing = await prisma.trainingAssignment.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify coach can access this assignment (template is in their categories)
    const coach = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { coachCategories: true },
    });
    if (coach?.coachCategories && coach.coachCategories.length > 0) {
      const templateCategories = (existing.template as any).ageCategories || [];
      if (templateCategories.length > 0 &&
          !templateCategories.some((cat: string) => coach.coachCategories!.includes(cat))) {
        return res.status(403).json({ error: 'Cannot update assignment outside your categories' });
      }
    }

    const assignment = await prisma.trainingAssignment.update({
      where: { id },
      data,
      include: {
        template: true,
      },
    });

    res.json(assignment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update assignment error:', error);
    res.status(500).json({ error: 'Failed to update assignment' });
  }
});

// DELETE /api/assignments/:id - Delete assignment (Coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Check if user is coach
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete assignments' });
    }

    const { id } = req.params;

    // Check if assignment exists
    const existing = await prisma.trainingAssignment.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Assignment not found' });
    }

    // Verify coach can access this assignment (template is in their categories)
    const coach = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { coachCategories: true },
    });
    if (coach?.coachCategories && coach.coachCategories.length > 0) {
      const templateCategories = (existing.template as any).ageCategories || [];
      if (templateCategories.length > 0 &&
          !templateCategories.some((cat: string) => coach.coachCategories!.includes(cat))) {
        return res.status(403).json({ error: 'Cannot delete assignment outside your categories' });
      }
    }

    await prisma.trainingAssignment.delete({
      where: { id },
    });

    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    console.error('Delete assignment error:', error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
