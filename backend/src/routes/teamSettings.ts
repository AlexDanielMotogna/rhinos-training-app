import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadTeamLogo, uploadImage } from '../utils/cloudinary.js';

const router = express.Router();

// GET /api/team-settings/branding - Get public branding info (no auth required)
// This is used on the login page to show team logo, name, and colors
router.get('/branding', async (req, res) => {
  try {
    let settings = await prisma.teamSettings.findFirst();

    // If no settings exist, return defaults
    if (!settings) {
      return res.json({
        teamName: 'TeamTrainer',
        appName: 'TeamTrainer',
        primaryColor: '#ffffffff',
        secondaryColor: '#ff9800',
        logoUrl: '/teamtrainer-logo.svg',
        faviconUrl: '/teamtrainer-logo.svg',
      });
    }

    // Return only public branding info (no sensitive data like aiApiKey)
    res.json({
      teamName: settings.teamName,
      appName: settings.appName,
      primaryColor: settings.primaryColor,
      secondaryColor: settings.secondaryColor,
      logoUrl: settings.logoUrl,
      faviconUrl: settings.faviconUrl,
    });
  } catch (error) {
    console.error('[TEAM SETTINGS] Get branding error:', error);
    res.status(500).json({ error: 'Failed to fetch branding' });
  }
});

// Validation schemas - use nullable().optional() to accept both null and undefined
const updateTeamSettingsSchema = z.object({
  teamName: z.string().min(1).nullable().optional(),
  appName: z.string().nullable().optional(),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable().optional(),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format').nullable().optional(),
  seasonPhase: z.enum(['off-season', 'pre-season', 'in-season']).nullable().optional(),
  teamLevel: z.enum(['amateur', 'semi-pro', 'pro', 'youth', 'recreational']).nullable().optional(),
  teamCategory: z.enum(['juvenil', 'principal', 'reserves', 'academy']).nullable().optional(),
  aiApiKey: z.string().nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  faviconUrl: z.string().nullable().optional(),
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
          teamName: 'TeamTrainer',
          appName: 'TeamTrainer',
          primaryColor: '##ffffffff',
          secondaryColor: '#ff9800',
          logoUrl: '/teamtrainer-logo.svg',
          faviconUrl: '/teamtrainer-logo.svg',
          seasonPhase: 'off-season',
          teamLevel: 'amateur',
          teamCategory: 'principal',
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
          teamName: validatedData.teamName || 'TeamTrainer',
          appName: validatedData.appName || 'TeamTrainer',
          primaryColor: validatedData.primaryColor || '##ffffffff',
          secondaryColor: validatedData.secondaryColor || '#ff9800',
          logoUrl: validatedData.logoUrl || '/teamtrainer-logo.svg',
          faviconUrl: validatedData.faviconUrl || '/teamtrainer-logo.svg',
          seasonPhase: validatedData.seasonPhase || 'off-season',
          teamLevel: validatedData.teamLevel || 'amateur',
          teamCategory: validatedData.teamCategory || 'principal',
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

    // Upload to Cloudinary using uploadTeamLogo
    const result = await uploadTeamLogo(req.file.buffer);

    // Update team settings with new logo URL
    let settings = await prisma.teamSettings.findFirst();

    if (!settings) {
      settings = await prisma.teamSettings.create({
        data: {
          teamName: 'TeamTrainer',
          appName: 'TeamTrainer',
          primaryColor: '#ffffffff',
          secondaryColor: '#ff9800',
          logoUrl: result.url,
          updatedBy: user.userId,
        },
      });
    } else {
      settings = await prisma.teamSettings.update({
        where: { id: settings.id },
        data: {
          logoUrl: result.url,
          updatedBy: user.userId,
        },
      });
    }

    console.log(`[TEAM SETTINGS] Logo uploaded by ${user.email}: ${result.url}`);
    res.json({ logoUrl: result.url, settings });
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

    // Upload to Cloudinary with custom folder for favicons
    const result = await uploadImage(req.file.buffer, { folder: 'rhinos-training/favicons' });

    // Update team settings with new favicon URL
    let settings = await prisma.teamSettings.findFirst();

    if (!settings) {
      settings = await prisma.teamSettings.create({
        data: {
          teamName: 'TeamTrainer',
          appName: 'TeamTrainer',
          primaryColor: '#ffffffff',
          secondaryColor: '#ff9800',
          faviconUrl: result.url,
          updatedBy: user.userId,
        },
      });
    } else {
      settings = await prisma.teamSettings.update({
        where: { id: settings.id },
        data: {
          faviconUrl: result.url,
          updatedBy: user.userId,
        },
      });
    }

    console.log(`[TEAM SETTINGS] Favicon uploaded by ${user.email}: ${result.url}`);
    res.json({ faviconUrl: result.url, settings });
  } catch (error) {
    console.error('[TEAM SETTINGS] Favicon upload error:', error);
    res.status(500).json({ error: 'Failed to upload favicon' });
  }
});

export default router;
