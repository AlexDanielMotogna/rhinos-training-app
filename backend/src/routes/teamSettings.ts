import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import multer from 'multer';
import { uploadToCloudinary } from '../utils/cloudinary.js';

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Validation schemas
const updateTeamSettingsSchema = z.object({
  teamName: z.string().min(1).optional(),
  appName: z.string().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').optional(),
  seasonPhase: z.enum(['off-season', 'pre-season', 'in-season']).optional(),
  teamLevel: z.enum(['jv', 'varsity', 'elite']).optional(),
  aiApiKey: z.string().optional(),
});

// GET /api/team-settings - Get team settings (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    // Get the first (and should be only) team settings document
    let settings = await prisma.teamSettings.findFirst();

    // If no settings exist, create default ones
    if (!settings) {
      settings = await prisma.teamSettings.create({
        data: {
          teamName: 'Rhinos',
          appName: 'Rhinos Training',
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e',
          seasonPhase: 'off-season',
          teamLevel: 'varsity',
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error('[TEAM SETTINGS] Get settings error:', error);
    res.status(500).json({ error: 'Failed to fetch team settings' });
  }
});

// PUT /api/team-settings - Update team settings (coach only)
router.put('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can update team settings
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update team settings' });
    }

    const validatedData = updateTeamSettingsSchema.parse(req.body);

    // Get existing settings or create if not exists
    let settings = await prisma.teamSettings.findFirst();

    if (!settings) {
      // Create new settings with validated data
      settings = await prisma.teamSettings.create({
        data: {
          teamName: validatedData.teamName || 'Rhinos',
          appName: validatedData.appName,
          primaryColor: validatedData.primaryColor || '#1976d2',
          secondaryColor: validatedData.secondaryColor || '#dc004e',
          seasonPhase: validatedData.seasonPhase || 'off-season',
          teamLevel: validatedData.teamLevel || 'varsity',
          aiApiKey: validatedData.aiApiKey,
          updatedBy: user.userId,
        },
      });
    } else {
      // Update existing settings
      settings = await prisma.teamSettings.update({
        where: { id: settings.id },
        data: {
          ...validatedData,
          updatedBy: user.userId,
        },
      });
    }

    console.log(`[TEAM SETTINGS] Settings updated by ${user.email}`);
    res.json(settings);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: error.errors[0].message });
    }
    console.error('[TEAM SETTINGS] Update settings error:', error);
    res.status(500).json({ error: 'Failed to update team settings' });
  }
});

// POST /api/team-settings/logo - Upload team logo (coach only)
router.post('/logo', authenticate, upload.single('logo'), async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can upload logo
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can upload team logo' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'team-logos');

    // Update team settings with new logo URL
    let settings = await prisma.teamSettings.findFirst();

    if (!settings) {
      settings = await prisma.teamSettings.create({
        data: {
          teamName: 'Rhinos',
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e',
          logoUrl: result.secure_url,
          updatedBy: user.userId,
        },
      });
    } else {
      settings = await prisma.teamSettings.update({
        where: { id: settings.id },
        data: {
          logoUrl: result.secure_url,
          updatedBy: user.userId,
        },
      });
    }

    console.log(`[TEAM SETTINGS] Logo uploaded by ${user.email}: ${result.secure_url}`);
    res.json({ logoUrl: result.secure_url, settings });
  } catch (error) {
    console.error('[TEAM SETTINGS] Logo upload error:', error);
    res.status(500).json({ error: 'Failed to upload logo' });
  }
});

// POST /api/team-settings/favicon - Upload favicon (coach only)
router.post('/favicon', authenticate, upload.single('favicon'), async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can upload favicon
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can upload favicon' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, 'team-favicons');

    // Update team settings with new favicon URL
    let settings = await prisma.teamSettings.findFirst();

    if (!settings) {
      settings = await prisma.teamSettings.create({
        data: {
          teamName: 'Rhinos',
          primaryColor: '#1976d2',
          secondaryColor: '#dc004e',
          faviconUrl: result.secure_url,
          updatedBy: user.userId,
        },
      });
    } else {
      settings = await prisma.teamSettings.update({
        where: { id: settings.id },
        data: {
          faviconUrl: result.secure_url,
          updatedBy: user.userId,
        },
      });
    }

    console.log(`[TEAM SETTINGS] Favicon uploaded by ${user.email}: ${result.secure_url}`);
    res.json({ faviconUrl: result.secure_url, settings });
  } catch (error) {
    console.error('[TEAM SETTINGS] Favicon upload error:', error);
    res.status(500).json({ error: 'Failed to upload favicon' });
  }
});

export default router;
