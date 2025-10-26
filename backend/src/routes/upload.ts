import express from 'express';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadAvatar, uploadTeamLogo, deleteImage } from '../utils/cloudinary.js';
import prisma from '../utils/prisma.js';

const router = express.Router();

// POST /api/upload/avatar - Upload user avatar
router.post('/avatar', authenticate, upload.single('avatar'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user!.userId;

    // Get current user to check for existing avatar
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    // Delete old avatar if exists
    if (user?.avatarPublicId) {
      try {
        await deleteImage(user.avatarPublicId);
      } catch (error) {
        console.error('Failed to delete old avatar:', error);
        // Continue anyway - old image might not exist
      }
    }

    // Upload new avatar
    const { url, publicId } = await uploadAvatar(req.file.buffer, userId);

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: url,
        avatarPublicId: publicId,
      },
      select: {
        id: true,
        name: true,
        avatarUrl: true,
      },
    });

    res.json({
      message: 'Avatar uploaded successfully',
      avatarUrl: updatedUser.avatarUrl,
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(500).json({ error: 'Failed to upload avatar' });
  }
});

// DELETE /api/upload/avatar - Delete user avatar
router.delete('/avatar', authenticate, async (req, res) => {
  try {
    const userId = req.user!.userId;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarPublicId: true },
    });

    if (!user?.avatarPublicId) {
      return res.status(404).json({ error: 'No avatar to delete' });
    }

    // Delete from Cloudinary
    await deleteImage(user.avatarPublicId);

    // Update user in database
    await prisma.user.update({
      where: { id: userId },
      data: {
        avatarUrl: null,
        avatarPublicId: null,
      },
    });

    res.json({ message: 'Avatar deleted successfully' });
  } catch (error) {
    console.error('Avatar deletion error:', error);
    res.status(500).json({ error: 'Failed to delete avatar' });
  }
});

// POST /api/upload/team-logo - Upload team logo (coaches only)
router.post('/team-logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    if (req.user!.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can upload team logo' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload logo
    const { url } = await uploadTeamLogo(req.file.buffer);

    // Update team settings (assuming single team)
    // You might want to adjust this logic based on your team structure
    const settings = await prisma.teamSettings.findFirst();

    if (settings) {
      await prisma.teamSettings.update({
        where: { id: settings.id },
        data: { logoUrl: url },
      });
    } else {
      await prisma.teamSettings.create({
        data: {
          teamName: 'Rhinos',
          primaryColor: '#203731',
          secondaryColor: '#FFB612',
          logoUrl: url,
        },
      });
    }

    res.json({
      message: 'Team logo uploaded successfully',
      logoUrl: url,
    });
  } catch (error) {
    console.error('Team logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload team logo' });
  }
});

export default router;
