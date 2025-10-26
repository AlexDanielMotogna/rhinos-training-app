import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Validation schemas
const createNotificationSchema = z.object({
  userId: z.string(),
  type: z.enum(['new_plan', 'plan_updated', 'new_session', 'private_session', 'attendance_poll']),
  title: z.string(),
  message: z.string(),
  actionUrl: z.string().optional(),
  referenceId: z.string().optional(),
});

// GET /api/notifications - Get user's notifications
router.get('/', async (req, res) => {
  try {
    const userId = (req as any).user.userId;
    const { unreadOnly } = req.query;

    const where: any = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50, // Limit to last 50 notifications
    });

    res.json(notifications);
  } catch (error) {
    console.error('[NOTIFICATIONS] Get notifications error:', error);
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

// GET /api/notifications/unread-count - Get count of unread notifications
router.get('/unread-count', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    const count = await prisma.notification.count({
      where: {
        userId,
        read: false,
      },
    });

    res.json({ count });
  } catch (error) {
    console.error('[NOTIFICATIONS] Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
});

// POST /api/notifications - Create notification (usually called by backend, not frontend)
router.post('/', async (req, res) => {
  try {
    const data = createNotificationSchema.parse(req.body);

    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        actionUrl: data.actionUrl,
        referenceId: data.referenceId,
        read: false,
      },
    });

    console.log(`[NOTIFICATIONS] Created notification for user ${data.userId}: ${data.title}`);
    res.status(201).json(notification);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[NOTIFICATIONS] Create notification error:', error);
    res.status(500).json({ error: 'Failed to create notification' });
  }
});

// PATCH /api/notifications/:id/read - Mark notification as read
router.patch('/:id/read', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to update this notification' });
    }

    const updated = await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    res.json(updated);
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark read error:', error);
    res.status(500).json({ error: 'Failed to mark notification as read' });
  }
});

// PATCH /api/notifications/mark-all-read - Mark all notifications as read
router.patch('/mark-all-read', async (req, res) => {
  try {
    const userId = (req as any).user.userId;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false,
      },
      data: {
        read: true,
      },
    });

    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('[NOTIFICATIONS] Mark all read error:', error);
    res.status(500).json({ error: 'Failed to mark all notifications as read' });
  }
});

// DELETE /api/notifications/:id - Delete notification
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.userId;

    // Verify notification belongs to user
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({ error: 'Not authorized to delete this notification' });
    }

    await prisma.notification.delete({
      where: { id },
    });

    res.json({ message: 'Notification deleted' });
  } catch (error) {
    console.error('[NOTIFICATIONS] Delete notification error:', error);
    res.status(500).json({ error: 'Failed to delete notification' });
  }
});

// Helper function to create notifications for multiple users
export async function createNotificationsForUsers(
  userIds: string[],
  type: string,
  title: string,
  message: string,
  actionUrl?: string,
  referenceId?: string
): Promise<void> {
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({
        userId,
        type,
        title,
        message,
        actionUrl,
        referenceId,
        read: false,
      })),
    });

    console.log(`[NOTIFICATIONS] Created ${userIds.length} notifications: ${title}`);
  } catch (error) {
    console.error('[NOTIFICATIONS] Error creating bulk notifications:', error);
  }
}

export default router;
