import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate, requireCoach } from '../middleware/auth.js';
import { createNotificationsForUsers } from './notifications.js';
import { t, formatPollMessage } from '../utils/i18n.js';
import { sseManager } from '../utils/sseManager.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createPollSchema = z.object({
  sessionId: z.string(),
  sessionName: z.string(),
  sessionDate: z.string(),
  expiresAt: z.string(), // ISO date string
});

const voteSchema = z.object({
  option: z.enum(['training', 'present', 'absent']),
});

// GET /api/attendance-polls - Get all polls
router.get('/', async (req, res) => {
  try {
    const user = (req as any).user;

    // Get user's category info for filtering
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    });

    const polls = await prisma.attendancePoll.findMany({
      include: {
        votes: true,
        session: {
          select: { ageCategories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter polls by user's category (based on session's categories)
    let filteredPolls = polls;
    if (dbUser) {
      if (dbUser.role === 'player' && dbUser.ageCategory) {
        // Players see polls for sessions with no category restriction OR including their category
        filteredPolls = polls.filter(poll => {
          const sessionCategories = (poll.session as any)?.ageCategories || [];
          return sessionCategories.length === 0 || sessionCategories.includes(dbUser.ageCategory);
        });
      } else if (dbUser.role === 'coach' && dbUser.coachCategories && dbUser.coachCategories.length > 0) {
        // Coaches see polls for sessions with no category restriction OR overlapping with their categories
        filteredPolls = polls.filter(poll => {
          const sessionCategories = (poll.session as any)?.ageCategories || [];
          return sessionCategories.length === 0 ||
            sessionCategories.some((cat: string) => dbUser.coachCategories!.includes(cat));
        });
      }
    }

    // Remove session from response to keep original structure
    res.json(filteredPolls.map(({ session, ...poll }) => poll));
  } catch (error) {
    console.error('[POLLS] Get polls error:', error);
    res.status(500).json({ error: 'Failed to fetch attendance polls' });
  }
});

// GET /api/attendance-polls/active - Get active poll
router.get('/active', async (req, res) => {
  try {
    const now = new Date().toISOString();
    const user = (req as any).user;

    // Get user's category info for filtering
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    });

    const activePolls = await prisma.attendancePoll.findMany({
      where: {
        isActive: true,
        expiresAt: { gt: now },
      },
      include: {
        votes: true,
        session: {
          select: { ageCategories: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by category
    let filteredPolls = activePolls;
    if (dbUser) {
      if (dbUser.role === 'player' && dbUser.ageCategory) {
        filteredPolls = activePolls.filter(poll => {
          const sessionCategories = (poll.session as any)?.ageCategories || [];
          return sessionCategories.length === 0 || sessionCategories.includes(dbUser.ageCategory);
        });
      } else if (dbUser.role === 'coach' && dbUser.coachCategories && dbUser.coachCategories.length > 0) {
        filteredPolls = activePolls.filter(poll => {
          const sessionCategories = (poll.session as any)?.ageCategories || [];
          return sessionCategories.length === 0 ||
            sessionCategories.some((cat: string) => dbUser.coachCategories!.includes(cat));
        });
      }
    }

    // Return first active poll for user's category
    const activePoll = filteredPolls.length > 0 ? filteredPolls[0] : null;

    // Remove session from response
    if (activePoll) {
      const { session, ...pollWithoutSession } = activePoll;
      res.json(pollWithoutSession);
    } else {
      res.json(null);
    }
  } catch (error) {
    console.error('[POLLS] Get active poll error:', error);
    res.status(500).json({ error: 'Failed to fetch active poll' });
  }
});

// GET /api/attendance-polls/:id - Get single poll
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.attendancePoll.findUnique({
      where: { id },
      include: {
        votes: true,
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    res.json(poll);
  } catch (error) {
    console.error('[POLLS] Get poll error:', error);
    res.status(500).json({ error: 'Failed to fetch poll' });
  }
});

// POST /api/attendance-polls - Create new poll
router.post('/', requireCoach, async (req, res) => {
  try {
    const data = createPollSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const poll = await prisma.attendancePoll.create({
      data: {
        sessionId: data.sessionId,
        sessionName: data.sessionName,
        sessionDate: data.sessionDate,
        createdBy: user.name,
        createdAt: new Date().toISOString(),
        expiresAt: data.expiresAt,
        isActive: true,
      },
      include: {
        votes: true,
      },
    });

    // Get session's categories for filtering notifications
    const session = await prisma.trainingSession.findUnique({
      where: { id: data.sessionId },
      select: { ageCategories: true },
    });
    const sessionCategories = (session as any)?.ageCategories || [];

    // Send notifications only to players in the same category
    let playersQuery: any = { role: 'player' };
    if (sessionCategories.length > 0) {
      // Only notify players whose category is in the session's categories
      playersQuery.ageCategory = { in: sessionCategories };
    }

    const playersToNotify = await prisma.user.findMany({
      where: playersQuery,
      select: { id: true, preferredLanguage: true },
    });

    if (playersToNotify.length > 0) {
      // Create notifications for each player with their preferred language
      for (const player of playersToNotify) {
        const lang = (player.preferredLanguage as 'de' | 'en') || 'de';
        const title = t('notification.attendancePoll.title', lang);
        const message = formatPollMessage(data.sessionName, data.sessionDate, lang);

        await createNotificationsForUsers(
          [player.id],
          'attendance_poll',
          title,
          message,
          '/training-sessions',
          poll.id
        );
      }
    }

    res.status(201).json(poll);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[POLLS] Create poll error:', error);
    res.status(500).json({ error: 'Failed to create poll' });
  }
});

// POST /api/attendance-polls/:id/vote - Submit or update vote
router.post('/:id/vote', async (req, res) => {
  try {
    const { id } = req.params;
    const data = voteSchema.parse(req.body);
    const userId = (req as any).user.userId;
    const user = await prisma.user.findUnique({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check if poll exists and is active
    const poll = await prisma.attendancePoll.findUnique({
      where: { id },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    if (!poll.isActive) {
      return res.status(400).json({ error: 'Poll is no longer active' });
    }

    if (new Date(poll.expiresAt) < new Date()) {
      return res.status(400).json({ error: 'Poll has expired' });
    }

    // Check if user already voted
    const existingVote = await prisma.attendancePollVote.findUnique({
      where: {
        pollId_userId: {
          pollId: id,
          userId: userId,
        },
      },
    });
    
    // Get fresh user data to include position
    const fullUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, position: true }
    });

    let vote;
    if (existingVote) {
      // Update existing vote
      vote = await prisma.attendancePollVote.update({
        where: { id: existingVote.id },
        data: {
          option: data.option,
          userPosition: fullUser?.position || undefined,
          timestamp: new Date().toISOString(),
        },
      });
    } else {
      // Create new vote
      vote = await prisma.attendancePollVote.create({
        data: {
          pollId: id,
          userId: userId,
          userName: fullUser?.name || user.name,
          userPosition: fullUser?.position || undefined,
          option: data.option,
          timestamp: new Date().toISOString(),
        },
      });
    }

    // Broadcast vote update via SSE to all clients watching this poll
    sseManager.broadcastToPoll(id, 'vote-update', {
      pollId: id,
      vote: {
        userId: vote.userId,
        userName: vote.userName,
        userPosition: vote.userPosition,
        option: vote.option,
        timestamp: vote.timestamp,
      },
      action: existingVote ? 'updated' : 'created',
    });

    console.log(`[POLLS] Vote ${existingVote ? 'updated' : 'created'} for poll ${id}, broadcasting to ${sseManager.getPollClientCount(id)} clients`);

    res.json(vote);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[POLLS] Vote error:', error);
    res.status(500).json({ error: 'Failed to submit vote' });
  }
});

// GET /api/attendance-polls/:id/results - Get poll results
router.get('/:id/results', async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.attendancePoll.findUnique({
      where: { id },
      include: {
        votes: true,
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    const results = {
      training: 0,
      present: 0,
      absent: 0,
      totalVotes: poll.votes.length,
      voters: {
        training: [] as any[],
        present: [] as any[],
        absent: [] as any[],
      },
    };

    poll.votes.forEach(vote => {
      if (vote.option === 'training') {
        results.training++;
        results.voters.training.push(vote);
      } else if (vote.option === 'present') {
        results.present++;
        results.voters.present.push(vote);
      } else if (vote.option === 'absent') {
        results.absent++;
        results.voters.absent.push(vote);
      }
    });

    res.json(results);
  } catch (error) {
    console.error('[POLLS] Get results error:', error);
    res.status(500).json({ error: 'Failed to fetch poll results' });
  }
});

// GET /api/attendance-polls/:id/attendees - Get list of confirmed attendees
// Returns users who voted 'training' or 'present' (confirmed to attend)
router.get('/:id/attendees', async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.attendancePoll.findUnique({
      where: { id },
      include: {
        votes: {
          where: {
            OR: [
              { option: 'training' },
              { option: 'present' }
            ]
          }
        },
      },
    });

    if (!poll) {
      return res.status(404).json({ error: 'Poll not found' });
    }

    // Return list of attendees with their details
    const attendees = poll.votes.map(vote => ({
      userId: vote.userId,
      userName: vote.userName,
      userPosition: vote.userPosition,
      option: vote.option,
      timestamp: vote.timestamp,
    }));

    res.json({
      sessionName: poll.sessionName,
      sessionDate: poll.sessionDate,
      totalAttendees: attendees.length,
      attendees,
    });
  } catch (error) {
    console.error('[POLLS] Get attendees error:', error);
    res.status(500).json({ error: 'Failed to fetch attendees' });
  }
});

// PATCH /api/attendance-polls/:id/close - Close/deactivate a poll
router.patch('/:id/close', requireCoach, async (req, res) => {
  try {
    const { id } = req.params;

    const poll = await prisma.attendancePoll.update({
      where: { id },
      data: { isActive: false },
      include: { votes: true },
    });

    res.json(poll);
  } catch (error) {
    console.error('[POLLS] Close poll error:', error);
    res.status(500).json({ error: 'Failed to close poll' });
  }
});

// DELETE /api/attendance-polls/:id - Delete a poll
router.delete('/:id', requireCoach, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.attendancePoll.delete({ where: { id } });

    res.json({ message: 'Poll deleted successfully' });
  } catch (error) {
    console.error('[POLLS] Delete poll error:', error);
    res.status(500).json({ error: 'Failed to delete poll' });
  }
});

export default router;
