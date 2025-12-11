import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all teams
router.get('/', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      include: {
        division: true,
      },
      orderBy: { name: 'asc' },
    });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Get team by ID
router.get('/:id', async (req, res) => {
  try {
    const team = await prisma.team.findUnique({
      where: { id: req.params.id },
      include: {
        division: true,
      },
    });

    if (!team) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Get teams by division
router.get('/division/:divisionId', async (req, res) => {
  try {
    const teams = await prisma.team.findMany({
      where: { divisionId: req.params.divisionId },
      orderBy: { name: 'asc' },
    });
    res.json(teams);
  } catch (error) {
    console.error('Error fetching teams by division:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// Create a new team
router.post('/', async (req, res) => {
  try {
    const { name, divisionId, logoUrl } = req.body;

    // Validation
    if (!name || !divisionId) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if division exists
    const division = await prisma.division.findUnique({
      where: { id: divisionId },
    });

    if (!division) {
      return res.status(400).json({ error: 'Division not found' });
    }

    // Check if team name already exists in this division
    const existing = await prisma.team.findFirst({
      where: {
        name,
        divisionId,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Team with this name already exists in this division' });
    }

    const team = await prisma.team.create({
      data: {
        name,
        divisionId,
        logoUrl: logoUrl || null,
      },
      include: {
        division: true,
      },
    });

    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Update a team
router.put('/:id', async (req, res) => {
  try {
    const { name, divisionId, logoUrl } = req.body;

    // Check if team exists
    const existing = await prisma.team.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Team not found' });
    }

    // If divisionId is being changed, check if the new division exists
    if (divisionId && divisionId !== existing.divisionId) {
      const division = await prisma.division.findUnique({
        where: { id: divisionId },
      });

      if (!division) {
        return res.status(400).json({ error: 'Division not found' });
      }
    }

    const team = await prisma.team.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(divisionId && { divisionId }),
        ...(logoUrl !== undefined && { logoUrl: logoUrl || null }),
      },
      include: {
        division: true,
      },
    });

    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete a team
router.delete('/:id', async (req, res) => {
  try {
    // Check if team exists
    const existing = await prisma.team.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Team not found' });
    }

    await prisma.team.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

export default router;
