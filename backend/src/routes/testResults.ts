import express from 'express';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/test-results
 * Get all test results for the authenticated user
 */
router.get('/', authenticate, async (req, res) => {
  try {
    const { testType } = req.query;

    const where: any = {
      userId: req.user!.userId,
    };

    if (testType) {
      where.testType = testType;
    }

    const results = await prisma.testResult.findMany({
      where,
      orderBy: {
        dateISO: 'desc',
      },
    });

    res.json(results);
  } catch (error) {
    console.error('Get test results error:', error);
    res.status(500).json({ error: 'Failed to fetch test results' });
  }
});

/**
 * GET /api/test-results/latest/:testType
 * Get the latest test result for a specific test type
 */
router.get('/latest/:testType', authenticate, async (req, res) => {
  try {
    const { testType } = req.params;

    const result = await prisma.testResult.findFirst({
      where: {
        userId: req.user!.userId,
        testType,
        isCurrent: true,
      },
      orderBy: {
        dateISO: 'desc',
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'No test result found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get latest test result error:', error);
    res.status(500).json({ error: 'Failed to fetch latest test result' });
  }
});

/**
 * GET /api/test-results/latest/:testType/:userId
 * Get the latest test result for a specific test type and user
 */
router.get('/latest/:testType/:userId', authenticate, async (req, res) => {
  try {
    const { testType, userId } = req.params;

    const result = await prisma.testResult.findFirst({
      where: {
        userId,
        testType,
        isCurrent: true,
      },
      orderBy: {
        dateISO: 'desc',
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'No test result found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get latest test result by user error:', error);
    res.status(500).json({ error: 'Failed to fetch latest test result' });
  }
});

/**
 * GET /api/test-results/latest/:testType/:userId
 * Get the latest test result for a specific test type and user
 */
router.get('/latest/:testType/:userId', authenticate, async (req, res) => {
  try {
    const { testType, userId } = req.params;

    const result = await prisma.testResult.findFirst({
      where: {
        userId,
        testType,
        isCurrent: true,
      },
      orderBy: {
        dateISO: 'desc',
      },
    });

    if (!result) {
      return res.status(404).json({ error: 'No test result found' });
    }

    res.json(result);
  } catch (error) {
    console.error('Get latest test result by user error:', error);
    res.status(500).json({ error: 'Failed to fetch latest test result' });
  }
});

/**
 * POST /api/test-results
 * Create a new test result
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const { testType, dateISO, testData, score, tier } = req.body;

    // Validate required fields
    if (!testType || !dateISO || !testData || score === undefined || !tier) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Mark all previous tests of this type as not current
    await prisma.testResult.updateMany({
      where: {
        userId: req.user!.userId,
        testType,
        isCurrent: true,
      },
      data: {
        isCurrent: false,
      },
    });

    // Create the new test result
    const newResult = await prisma.testResult.create({
      data: {
        userId: req.user!.userId,
        testType,
        dateISO,
        testData,
        score,
        tier,
        isCurrent: true,
      },
    });

    res.status(201).json(newResult);
  } catch (error) {
    console.error('Create test result error:', error);
    res.status(500).json({ error: 'Failed to create test result' });
  }
});

/**
 * DELETE /api/test-results/:id
 * Delete a test result
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    // Verify ownership
    const result = await prisma.testResult.findUnique({
      where: { id },
    });

    if (!result) {
      return res.status(404).json({ error: 'Test result not found' });
    }

    if (result.userId !== req.user!.userId) {
      return res.status(403).json({ error: 'Not authorized to delete this test result' });
    }

    // Delete the test result
    await prisma.testResult.delete({
      where: { id },
    });

    // If this was the current test, mark the most recent remaining test as current
    if (result.isCurrent) {
      const latestRemaining = await prisma.testResult.findFirst({
        where: {
          userId: req.user!.userId,
          testType: result.testType,
        },
        orderBy: {
          dateISO: 'desc',
        },
      });

      if (latestRemaining) {
        await prisma.testResult.update({
          where: { id: latestRemaining.id },
          data: { isCurrent: true },
        });
      }
    }

    res.json({ message: 'Test result deleted successfully' });
  } catch (error) {
    console.error('Delete test result error:', error);
    res.status(500).json({ error: 'Failed to delete test result' });
  }
});

export default router;
