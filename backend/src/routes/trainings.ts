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
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

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

    // Filter sessions based on user role and session category
    const filteredSessions = sessions.filter(session => {
      // Team sessions: everyone can see
      if (session.sessionCategory === 'team') {
        return true;
      }

      // Private sessions: creator, attendees, AND coaches can see
      if (session.sessionCategory === 'private') {
        // Coaches can see all private sessions to monitor team activities
        if (user.role === 'coach') {
          return true;
        }

        // Check if user is creator
        if (session.creatorId === userId) {
          return true;
        }

        // Check if user is in attendees
        const attendees = session.attendees as any[];
        const isAttendee = attendees?.some(a => a.userId === userId);
        if (isAttendee) {
          return true;
        }

        // User cannot see this private session
        return false;
      }

      // Default: show session
      return true;
    });

    res.json(filteredSessions.map(s => ({
      ...s,
      attendees: s.attendees as any,
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
    const userId = (req as any).user.userId;

    const session = await prisma.trainingSession.findUnique({
      where: { id },
      include: {
        polls: true,
      },
    });

    if (!session) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    // Check access for private sessions
    if (session.sessionCategory === 'private') {
      // Get user to check role
      const user = await prisma.user.findUnique({ where: { id: userId } });

      // Coaches can see all private sessions
      if (user?.role === 'coach') {
        // Allow access
      } else {
        // For non-coaches, check if user is creator or attendee
        const attendees = session.attendees as any[];
        const isCreator = session.creatorId === userId;
        const isAttendee = attendees?.some(a => a.userId === userId);

        if (!isCreator && !isAttendee) {
          return res.status(403).json({ error: 'Access denied to this private session' });
        }
      }
    }

    res.json({
      ...session,
      attendees: session.attendees as any,
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

    // Create session with auto-created attendance poll
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
      },
    });

    // Auto-create attendance poll ONLY for team sessions
    // Private sessions don't need polls since they work differently
    if (data.sessionCategory === 'team') {
      const expiresAt = new Date(data.date);
      expiresAt.setHours(23, 59, 59, 999); // Expires at end of session date

      await prisma.attendancePoll.create({
        data: {
          sessionId: session.id,
          sessionName: data.title,
          sessionDate: data.date,
          createdBy: userId,
          createdAt: new Date().toISOString(),
          expiresAt: expiresAt.toISOString(),
          isActive: true,
        },
      });
    }

    // Send notifications based on session category
    let playersToNotify: Array<{ id: string; preferredLanguage: string | null }> = [];

    if (data.sessionCategory === 'team') {
      // Team sessions: notify all players except creator
      const allPlayers = await prisma.user.findMany({
        where: { role: 'player' },
        select: { id: true, preferredLanguage: true },
      });
      playersToNotify = allPlayers.filter(p => p.id !== userId);
    } else if (data.sessionCategory === 'private') {
      // Private sessions: only notify attendees (excluding creator)
      const attendeeIds = data.attendees.map(a => a.userId).filter(id => id !== userId);

      if (attendeeIds.length > 0) {
        const attendeePlayers = await prisma.user.findMany({
          where: { id: { in: attendeeIds } },
          select: { id: true, preferredLanguage: true },
        });
        playersToNotify = attendeePlayers;
      }
    }

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

// POST /api/trainings/:id/rsvp - Update RSVP status
router.post('/:id/rsvp', async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, status } = req.body;

    if (!userId || !status) {
      return res.status(400).json({ error: 'userId and status are required' });
    }

    if (!['going', 'maybe', 'not-going'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    // Check if session exists
    const session = await prisma.trainingSession.findUnique({ where: { id } });
    if (!session) {
      return res.status(404).json({ error: 'Training session not found' });
    }

    // Get user info
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update attendees array
    const attendees = (session.attendees as any[]) || [];
    const existingIndex = attendees.findIndex((a: any) => a.userId === userId);

    if (existingIndex >= 0) {
      // Update existing attendee
      attendees[existingIndex].status = status;
    } else {
      // Add new attendee
      attendees.push({
        userId,
        userName: user.name,
        status,
      });
    }

    // Update session
    const updated = await prisma.trainingSession.update({
      where: { id },
      data: { attendees: attendees as any },
    });

    res.json({
      ...updated,
      attendees: updated.attendees as any,
      version: 1,
      updatedAt: updated.updatedAt.toISOString(),
    });
  } catch (error) {
    console.error('RSVP error:', error);
    res.status(500).json({ error: 'Failed to update RSVP' });
  }
});

export default router;
