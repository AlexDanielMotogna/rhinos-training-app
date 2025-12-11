import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all divisions
router.get('/', async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      include: {
        teams: true,
      },
      orderBy: [
        { season: 'desc' },
        { conference: 'asc' },
      ],
    });
    res.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions:', error);
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

// Get division by ID
router.get('/:id', async (req, res) => {
  try {
    const division = await prisma.division.findUnique({
      where: { id: req.params.id },
      include: {
        teams: true,
      },
    });

    if (!division) {
      return res.status(404).json({ error: 'Division not found' });
    }

    res.json(division);
  } catch (error) {
    console.error('Error fetching division:', error);
    res.status(500).json({ error: 'Failed to fetch division' });
  }
});

// Get divisions by season
router.get('/season/:season', async (req, res) => {
  try {
    const divisions = await prisma.division.findMany({
      where: { season: req.params.season },
      include: {
        teams: true,
      },
      orderBy: { conference: 'asc' },
    });
    res.json(divisions);
  } catch (error) {
    console.error('Error fetching divisions by season:', error);
    res.status(500).json({ error: 'Failed to fetch divisions' });
  }
});

// Create a new division
router.post('/', async (req, res) => {
  try {
    const { name, conference, season } = req.body;

    // Validation
    if (!name || !conference || !season) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (!['A', 'B', 'C', 'D'].includes(conference)) {
      return res.status(400).json({ error: 'Invalid conference. Must be A, B, C, or D' });
    }

    // Check if division already exists
    const existing = await prisma.division.findFirst({
      where: {
        name,
        conference,
        season,
      },
    });

    if (existing) {
      return res.status(400).json({ error: 'Division with this name, conference, and season already exists' });
    }

    const division = await prisma.division.create({
      data: {
        name,
        conference,
        season,
      },
      include: {
        teams: true,
      },
    });

    res.status(201).json(division);
  } catch (error) {
    console.error('Error creating division:', error);
    res.status(500).json({ error: 'Failed to create division' });
  }
});

// Update a division
router.put('/:id', async (req, res) => {
  try {
    const { name, conference, season } = req.body;

    // Check if division exists
    const existing = await prisma.division.findUnique({
      where: { id: req.params.id },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Division not found' });
    }

    // Validate conference if provided
    if (conference && !['A', 'B', 'C', 'D'].includes(conference)) {
      return res.status(400).json({ error: 'Invalid conference. Must be A, B, C, or D' });
    }

    const division = await prisma.division.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(conference && { conference }),
        ...(season && { season }),
      },
      include: {
        teams: true,
      },
    });

    res.json(division);
  } catch (error) {
    console.error('Error updating division:', error);
    res.status(500).json({ error: 'Failed to update division' });
  }
});

// Delete a division (also deletes all teams in the division)
router.delete('/:id', async (req, res) => {
  try {
    // Check if division exists
    const existing = await prisma.division.findUnique({
      where: { id: req.params.id },
      include: {
        teams: true,
      },
    });

    if (!existing) {
      return res.status(404).json({ error: 'Division not found' });
    }

    // Delete all teams in the division first
    await prisma.team.deleteMany({
      where: { divisionId: req.params.id },
    });

    // Then delete the division
    await prisma.division.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting division:', error);
    res.status(500).json({ error: 'Failed to delete division' });
  }
});

export default router;
