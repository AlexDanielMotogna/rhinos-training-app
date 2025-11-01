import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { createNotificationsForUsers } from './notifications.js';
import { t, formatSessionMessage, formatPrivateSessionTitle } from '../utils/i18n.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createTrainingSchema = z.object({
  sessionCategory: z.enum(['team', 'private']),
  type: z.enum(['gym', 'outdoor', 'coach-plan', 'free-training']),
  title: z.string().min(1),
  location: z.string().min(1),
  address: z.string().optional(),
  date: z.string(), // ISO date
  time: z.string(), // HH:mm
  description: z.string().optional(),
  attendees: z.array(z.object({
    userId: z.string(),
    userName: z.string(),
    status: z.enum(['going', 'maybe', 'not-going']),
  })).optional().default([]),
});

const updateTrainingSchema = createTrainingSchema.partial();

// GET /api/trainings - Get training sessions
// Query params: from (ISO date), days (number)
router.get('/', async (req, res) => {
  try {
    const { from, days } = req.query;

    let filter: any = {};

    if (from && days) {
      const fromDate = new Date(from as string);
      const toDate = new Date(fromDate);
      toDate.setDate(toDate.getDate() + parseInt(days as string));

      filter.date = {
        gte: fromDate.toISOString().split('T')[0],
        lte: toDate.toISOString().split('T')[0],
      };
    }

    const sessions = await prisma.trainingSession.findMany({
      where: filter,
      orderBy: { date: 'asc' },
    });

    res.json(sessions.map(s => ({
      ...s,
      attendees: s.attendees as any,
      checkIns: s.checkIns as any || [],
      version: 1,
      updatedAt: s.updatedAt.toISOString(),
    })));
  } catch (error) {
    console.error('Get trainings error:', error);
    res.status(500).json({ error: 'Failed to fetch training sessions' });
  }
});

// GET /api/trainings/:id - Get single training session
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        polls: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    res.json({
      ...session,
      attendees: session.attendees as any,
      checkIns: session.checkIns as any || [],
      version: 1,
      updatedAt: session.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('Get training error:', error);
    res.status(500).json({ error: 'Failed to fetch training session' });
  }
});

// POST /api/trainings - Create training session
router.post('/', async (req, res) => {
  try {
    const data = createTrainingSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const session = await prisma.trainingSession.create({
      data: {
        creatorId: userId,
        creatorName: user.name,
        sessionCategory: data.sessionCategory,
        type: data.type,
        title: data.title,
        location: data.location,
        address: data.address,
        date: data.date,
        time: data.time,
        description: data.description,
        attendees: data.attendees as any,
        checkIns: [],
      },
    });

    // Send notifications to all players
    const allPlayers = await prisma.user.findMany({
      where: { role: 'player' },
      select: { id: true, preferredLanguage: true },
    });

    const playersToNotify = allPlayers.filter(p => p.id !== userId);

    if (playersToNotify.length > 0) {
      const notificationType = data.sessionCategory === 'team' ? 'new_session' : 'private_session';

      // Create notifications for each player with their preferred language
      for (const player of playersToNotify) {
        const lang = (player.preferredLanguage as 'de' | 'en') || 'de';

        const title = data.sessionCategory === 'team'
          ? t('notification.newSession.title', lang)
          : formatPrivateSessionTitle(user.name, lang);

        const message = formatSessionMessage(data.title, data.date, data.time, data.location, lang);

        await createNotificationsForUsers(
          [player.id],
          notificationType,
          title,
          message,
          '/training-sessions',
          session.id
        );
      }
    }

    res.status(201).json({
      ...session,
      attendees: session.attendees as any,
      checkIns: [],
      version: 1,
      updatedAt: session.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Create training error:', error);
    res.status(500).json({ error: 'Failed to create training session' });
  }
});

// PATCH /api/trainings/:id - Update training session
router.patch('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const data = updateTrainingSchema.parse(req.body);
    const userId = (req as any).user.userId;

    // Check if session exists and user is creator
    const existing = await prisma.trainingSession.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    // Only creator or coach can update
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (existing.creatorId !== userId && user?.role !== 'coach') {
      return res.status(403).json({ error: 'Not authorized to update this session' });
    }

    const updated = await prisma.trainingSession.update({
      where: { id },
      data: {
        ...data,
        attendees: data.attendees as any,
      },
    });

    res.json({
      ...updated,
      attendees: updated.attendees as any,
      checkIns: updated.checkIns as any || [],
      version: 1,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Update training error:', error);
    res.status(500).json({ error: 'Failed to update training session' });
  }
});

// DELETE /api/trainings/:id - Delete training session
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Check if session exists and user is creator
    const existing = await prisma.trainingSession.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    // Only creator or coach can delete
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (existing.creatorId !== userId && user?.role !== 'coach') {
      return res.status(403).json({ error: 'Not authorized to delete this session' });
    }

    await prisma.trainingSession.delete({ where: { id } });

    res.json({ message: 'Training session deleted' });
  } catch (error) {
    console.error('Delete training error:', error);
    res.status(500).json({ error: 'Failed to delete training session' });
  }
});

export default router;
