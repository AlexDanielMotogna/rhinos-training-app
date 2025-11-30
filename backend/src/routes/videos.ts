import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Validation schemas
const createVideoSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().default(''),
  youtubeUrl: z.string().url('Invalid YouTube URL'),
  type: z.enum(['position', 'route', 'coverage', 'run']),
  status: z.enum(['draft', 'published']).default('draft'),
  level: z.enum(['intro', 'intermediate', 'advanced']).optional(),
  unit: z.enum(['Offense', 'Defense', 'Special Teams']).optional(),
  positions: z.array(z.string()).default([]),
  routes: z.array(z.string()).default([]),
  coverages: z.array(z.string()).default([]),
  runs: z.array(z.string()).default([]),
  createdBy: z.string(),
  order: z.number().default(0),
  isPinned: z.boolean().default(false),
  ageCategories: z.array(z.string()).default([]), // Categories this video is visible to
});

const updateVideoSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  youtubeUrl: z.string().url().optional(),
  type: z.enum(['position', 'route', 'coverage', 'run']).optional(),
  status: z.enum(['draft', 'published']).optional(),
  level: z.enum(['intro', 'intermediate', 'advanced']).optional().nullable(),
  unit: z.enum(['Offense', 'Defense', 'Special Teams']).optional().nullable(),
  positions: z.array(z.string()).optional(),
  routes: z.array(z.string()).optional(),
  coverages: z.array(z.string()).optional(),
  runs: z.array(z.string()).optional(),
  order: z.number().optional(),
  isPinned: z.boolean().optional(),
  ageCategories: z.array(z.string()).optional(), // Categories this video is visible to
});

// GET /api/videos - Get all videos
router.get('/', authenticate, async (req, res) => {
  try {
    const { type } = req.query;
    const user = (req as any).user;

    // Get user's category info for filtering
    const dbUser = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { role: true, ageCategory: true, coachCategories: true },
    });

    const where: any = {};

    // If player, only show published videos
    if (user.role === 'player') {
      where.status = 'published';
    }

    // Filter by type if provided
    if (type && typeof type === 'string') {
      where.type = type;
    }

    const videos = await prisma.video.findMany({
      where,
      orderBy: [
        { isPinned: 'desc' },
        { order: 'asc' },
        { createdAt: 'desc' },
      ],
    });

    // Filter videos by user's category
    let filteredVideos = videos;
    if (dbUser) {
      if (dbUser.role === 'player' && dbUser.ageCategory) {
        // Players see videos that: have no category restriction OR include their category
        filteredVideos = videos.filter(video => {
          const videoCategories = (video as any).ageCategories || [];
          return videoCategories.length === 0 || videoCategories.includes(dbUser.ageCategory);
        });
      } else if (dbUser.role === 'coach' && dbUser.coachCategories && dbUser.coachCategories.length > 0) {
        // Coaches see videos that: have no category restriction OR overlap with their categories
        filteredVideos = videos.filter(video => {
          const videoCategories = (video as any).ageCategories || [];
          return videoCategories.length === 0 ||
            videoCategories.some((cat: string) => dbUser.coachCategories!.includes(cat));
        });
      }
      // If no category set, show all videos (admin/superuser behavior)
    }

    res.json(filteredVideos);
  } catch (error) {
    console.error('[VIDEOS] Get videos error:', error);
    res.status(500).json({ error: 'Failed to fetch videos' });
  }
});

// GET /api/videos/:id - Get single video
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const video = await prisma.video.findUnique({
      where: { id },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Check if player can access this video
    const user = (req as any).user;
    if (user.role === 'player' && video.status !== 'published') {
      return res.status(403).json({ error: 'Access denied to draft video' });
    }

    res.json(video);
  } catch (error) {
    console.error('[VIDEOS] Get video error:', error);
    res.status(500).json({ error: 'Failed to fetch video' });
  }
});

// POST /api/videos - Create video (coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can create videos
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create videos' });
    }

    const data = createVideoSchema.parse(req.body);

    // Get coach's categories to auto-assign if not provided
    const coach = await prisma.user.findUnique({
      where: { id: user.userId },
      select: { coachCategories: true },
    });

    // Use provided categories or default to coach's categories
    const ageCategories = data.ageCategories.length > 0
      ? data.ageCategories
      : (coach?.coachCategories || []);

    const video = await prisma.video.create({
      data: {
        title: data.title,
        description: data.description,
        youtubeUrl: data.youtubeUrl,
        type: data.type,
        status: data.status,
        level: data.level,
        unit: data.unit,
        positions: data.positions,
        routes: data.routes,
        coverages: data.coverages,
        runs: data.runs,
        createdBy: data.createdBy,
        order: data.order,
        isPinned: data.isPinned,
        ageCategories: ageCategories,
      },
    });

    console.log(`[VIDEOS] Video created: ${video.title} by ${user.email}, categories: ${ageCategories.join(', ') || 'all'}`);
    res.status(201).json(video);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[VIDEOS] Create video error:', error);
    res.status(500).json({ error: 'Failed to create video' });
  }
});

// PUT /api/videos/:id - Update video (coach only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can update videos
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update videos' });
    }

    // Check if video exists
    const existingVideo = await prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const data = updateVideoSchema.parse(req.body);

    const updateData: any = {};
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.youtubeUrl !== undefined) updateData.youtubeUrl = data.youtubeUrl;
    if (data.type !== undefined) updateData.type = data.type;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.level !== undefined) updateData.level = data.level;
    if (data.unit !== undefined) updateData.unit = data.unit;
    if (data.positions !== undefined) updateData.positions = data.positions;
    if (data.routes !== undefined) updateData.routes = data.routes;
    if (data.coverages !== undefined) updateData.coverages = data.coverages;
    if (data.runs !== undefined) updateData.runs = data.runs;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.isPinned !== undefined) updateData.isPinned = data.isPinned;

    const video = await prisma.video.update({
      where: { id },
      data: updateData,
    });

    console.log(`[VIDEOS] Video updated: ${video.title} by ${user.email}`);
    res.json(video);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[VIDEOS] Update video error:', error);
    res.status(500).json({ error: 'Failed to update video' });
  }
});

// DELETE /api/videos/:id - Delete video (coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can delete videos
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete videos' });
    }

    // Check if video exists
    const existingVideo = await prisma.video.findUnique({
      where: { id },
    });

    if (!existingVideo) {
      return res.status(404).json({ error: 'Video not found' });
    }

    // Delete all progress for this video first
    await prisma.videoProgress.deleteMany({
      where: { videoId: id },
    });

    await prisma.video.delete({
      where: { id },
    });

    console.log(`[VIDEOS] Video deleted: ${existingVideo.title} by ${user.email}`);
    res.json({ message: 'Video deleted successfully' });
  } catch (error) {
    console.error('[VIDEOS] Delete video error:', error);
    res.status(500).json({ error: 'Failed to delete video' });
  }
});

// ========================================
// VIDEO PROGRESS ENDPOINTS
// ========================================

const progressSchema = z.object({
  lastTimestamp: z.number().min(0),
  totalDuration: z.number().min(0),
  percentWatched: z.number().min(0).max(100),
  completed: z.boolean().default(false),
});

// POST /api/videos/:id/progress - Save/update video progress
router.post('/:id/progress', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id: videoId } = req.params;

    // Verify video exists
    const video = await prisma.video.findUnique({
      where: { id: videoId },
    });

    if (!video) {
      return res.status(404).json({ error: 'Video not found' });
    }

    const data = progressSchema.parse(req.body);

    // Upsert progress (create or update)
    const progress = await prisma.videoProgress.upsert({
      where: {
        userId_videoId: {
          userId: user.userId,
          videoId: videoId,
        },
      },
      create: {
        userId: user.userId,
        videoId: videoId,
        lastTimestamp: data.lastTimestamp,
        totalDuration: data.totalDuration,
        percentWatched: data.percentWatched,
        completed: data.completed,
      },
      update: {
        lastTimestamp: data.lastTimestamp,
        totalDuration: data.totalDuration,
        percentWatched: data.percentWatched,
        completed: data.completed,
      },
    });

    res.json(progress);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[VIDEOS] Save progress error:', error);
    res.status(500).json({ error: 'Failed to save progress' });
  }
});

// GET /api/videos/:id/progress - Get current user's progress for a video
router.get('/:id/progress', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id: videoId } = req.params;

    const progress = await prisma.videoProgress.findUnique({
      where: {
        userId_videoId: {
          userId: user.userId,
          videoId: videoId,
        },
      },
    });

    if (!progress) {
      return res.status(404).json({ error: 'No progress found for this video' });
    }

    res.json(progress);
  } catch (error) {
    console.error('[VIDEOS] Get progress error:', error);
    res.status(500).json({ error: 'Failed to fetch progress' });
  }
});

// GET /api/videos/progress/user/:userId - Get all progress for a user (coach only)
router.get('/progress/user/:userId', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { userId } = req.params;

    // Only coaches can view other users' progress
    if (user.role !== 'coach' && user.userId !== userId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const progress = await prisma.videoProgress.findMany({
      where: { userId },
      orderBy: { lastWatchedAt: 'desc' },
    });

    res.json(progress);
  } catch (error) {
    console.error('[VIDEOS] Get user progress error:', error);
    res.status(500).json({ error: 'Failed to fetch user progress' });
  }
});

export default router;
