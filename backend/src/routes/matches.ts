import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all matches
router.get('/', async (req, res) => {
  try {
    const currentUser = (req as any).user;

    // Get current user's category info
    const dbUser = currentUser ? await prisma.user.findUnique({
      where: { id: currentUser.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    }) : null;

    const matches = await prisma.match.findMany({
      orderBy: [
        { week: 'asc' },
        { date: 'asc' },
      ],
    });

    // Filter by category
    let filtered = matches;
    if (dbUser) {
      if (dbUser.role === 'player' && dbUser.ageCategory) {
        filtered = matches.filter(match => {
          const categories = (match as any).ageCategories || [];
          if (categories.length === 0) return false; // Don't show empty
          return categories.includes(dbUser.ageCategory);
        });
      } else if (dbUser.role === 'coach' && dbUser.coachCategories && dbUser.coachCategories.length > 0) {
        filtered = matches.filter(match => {
          const categories = (match as any).ageCategories || [];
          if (categories.length === 0) return false; // Don't show empty
          return categories.some((cat: string) => dbUser.coachCategories!.includes(cat));
        });
      }
    }

    res.json(filtered);
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get match by ID
router.get('/:id', async (req, res) => {
  try {
    const match = await prisma.match.findUnique({
      where: { id: req.params.id },
    });

    if (!match) {
      return res.status(404).json({ error: 'Match not found' });
    }

    res.json(match);
  } catch (error) {
    console.error('Error fetching match:', error);
    res.status(500).json({ error: 'Failed to fetch match' });
  }
});

// Get matches by team name
router.get('/team/:teamName', async (req, res) => {
  try {
    const { teamName } = req.params;
    const matches = await prisma.match.findMany({
      where: {
        OR: [
          { homeTeam: teamName },
          { awayTeam: teamName },
        ],
      },
      orderBy: [
        { week: 'asc' },
        { date: 'asc' },
      ],
    });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches by team:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get matches by conference
router.get('/conference/:conference', async (req, res) => {
  try {
    const matches = await prisma.match.findMany({
      where: { conference: req.params.conference },
      orderBy: [
        { week: 'asc' },
        { date: 'asc' },
      ],
    });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches by conference:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Get matches by week
router.get('/week/:week', async (req, res) => {
  try {
    const week = parseInt(req.params.week);
    const matches = await prisma.match.findMany({
      where: { week },
      orderBy: { date: 'asc' },
    });
    res.json(matches);
  } catch (error) {
    console.error('Error fetching matches by week:', error);
    res.status(500).json({ error: 'Failed to fetch matches' });
  }
});

// Create a new match
router.post('/', async (req, res) => {
  try {
    const {
      spielnummer,
      homeTeam,
      awayTeam,
      date,
      kickoff,
      spielort,
      week,
      weekLabel,
      conference,
      homeScore,
      awayScore,
      isRelegation,
      isSemifinal,
      isIronBowl,
      createdBy,
    } = req.body;

    // Validation
    if (!spielnummer || !homeTeam || !awayTeam || !date || !kickoff || !spielort || !week || !weekLabel || !conference || !createdBy) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if spielnummer already exists
    const existing = await prisma.match.findUnique({
      where: { spielnummer },
    });

    if (existing) {
      return res.status(400).json({ error: 'Match with this Spielnummer already exists' });
    }

    const match = await prisma.match.create({
      data: {
        spielnummer,
        homeTeam,
        awayTeam,
        date,
        kickoff,
        spielort,
        week,
        weekLabel,
        conference,
        homeScore: homeScore !== undefined ? homeScore : null,
        awayScore: awayScore !== undefined ? awayScore : null,
        isRelegation: isRelegation || false,
        isSemifinal: isSemifinal || false,
        isIronBowl: isIronBowl || false,
        createdBy,
      },
    });

    res.status(201).json(match);
  } catch (error) {
    console.error('Error creating match:', error);
    res.status(500).json({ error: 'Failed to create match' });
  }
});

// Bulk create matches
router.post('/bulk', async (req, res) => {
  try {
    const { matches, createdBy } = req.body;

    if (!Array.isArray(matches) || matches.length === 0) {
      return res.status(400).json({ error: 'Invalid matches array' });
    }

    if (!createdBy) {
      return res.status(400).json({ error: 'Missing createdBy field' });
    }

    // Add createdBy to all matches
    const matchesWithCreator = matches.map((match) => ({
      ...match,
      createdBy,
      isRelegation: match.isRelegation || false,
      isSemifinal: match.isSemifinal || false,
      isIronBowl: match.isIronBowl || false,
    }));

    const result = await prisma.match.createMany({
      data: matchesWithCreator,
      skipDuplicates: true, // Skip matches with duplicate spielnummer
    });

    res.status(201).json({ count: result.count });
  } catch (error) {
    console.error('Error bulk creating matches:', error);
    res.status(500).json({ error: 'Failed to bulk create matches' });
  }
});

// Update a match
router.put('/:id', async (req, res) => {
  try {
    const {
      spielnummer,
      homeTeam,
      awayTeam,
      date,
      kickoff,
      spielort,
      week,
      weekLabel,
      conference,
      homeScore,
      awayScore,
      isRelegation,
      isSemifinal,
      isIronBowl,
    } = req.body;

    // Check if match exists
    const existing = await prisma.match.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Match not found' });
    }

    // If spielnummer is being changed, check it doesn't conflict
    if (spielnummer && spielnummer !== existing.spielnummer) {
      const conflict = await prisma.match.findUnique({
        where: { spielnummer },
      });
      if (conflict) {
        return res.status(400).json({ error: 'Match with this Spielnummer already exists' });
      }
    }

    const match = await prisma.match.update({
      where: { id: req.params.id },
      data: {
        spielnummer,
        homeTeam,
        awayTeam,
        date,
        kickoff,
        spielort,
        week,
        weekLabel,
        conference,
        homeScore: homeScore !== undefined ? homeScore : undefined,
        awayScore: awayScore !== undefined ? awayScore : undefined,
        isRelegation,
        isSemifinal,
        isIronBowl,
      },
    });

    res.json(match);
  } catch (error) {
    console.error('Error updating match:', error);
    res.status(500).json({ error: 'Failed to update match' });
  }
});

// Delete a match
router.delete('/:id', async (req, res) => {
  try {
    // Check if match exists
    const existing = await prisma.match.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Match not found' });
    }

    await prisma.match.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting match:', error);
    res.status(500).json({ error: 'Failed to delete match' });
  }
});

// Delete all matches (use with caution!)
router.delete('/', async (req, res) => {
  try {
    const result = await prisma.match.deleteMany({});
    res.json({ count: result.count });
  } catch (error) {
    console.error('Error deleting all matches:', error);
    res.status(500).json({ error: 'Failed to delete all matches' });
  }
});

export default router;
