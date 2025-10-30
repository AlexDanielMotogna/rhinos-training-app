import express from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { authenticate } from '../middleware/auth.js';
import { upload, uploadEquipmentImage, deleteImage } from '../utils/cloudinary.js';

const router = express.Router();

// Validation schemas
const createEquipmentSchema = z.object({
  name: z.string().min(1, 'Equipment name is required'),
  quantity: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
});

const updateEquipmentSchema = z.object({
  name: z.string().min(1).optional(),
  quantity: z.number().min(0).optional(),
  imageUrl: z.string().optional(),
  imagePublicId: z.string().optional(),
});

// GET /api/equipment - Get all equipment (authenticated)
router.get('/', authenticate, async (req, res) => {
  try {
    const equipment = await prisma.equipment.findMany({
      orderBy: { name: 'asc' },
    });

    res.json(equipment);
  } catch (error) {
    console.error('[EQUIPMENT] Get equipment error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// GET /api/equipment/:id - Get single equipment (authenticated)
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;

    const equipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!equipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    res.json(equipment);
  } catch (error) {
    console.error('[EQUIPMENT] Get equipment error:', error);
    res.status(500).json({ error: 'Failed to fetch equipment' });
  }
});

// POST /api/equipment - Create equipment (coach only)
router.post('/', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;

    // Only coaches can create equipment
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can create equipment' });
    }

    const data = createEquipmentSchema.parse(req.body);

    // Check if equipment with same name already exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { name: data.name },
    });

    if (existingEquipment) {
      return res.status(400).json({ error: 'Equipment with this name already exists' });
    }

    const equipment = await prisma.equipment.create({
      data: {
        name: data.name,
        quantity: data.quantity,
        imageUrl: data.imageUrl,
        imagePublicId: data.imagePublicId,
      },
    });

    console.log(`[EQUIPMENT] Equipment created: ${equipment.name} by ${user.email}`);
    res.status(201).json(equipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[EQUIPMENT] Create equipment error:', error);
    res.status(500).json({ error: 'Failed to create equipment' });
  }
});

// PUT /api/equipment/:id - Update equipment (coach only)
router.put('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can update equipment
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can update equipment' });
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    const data = updateEquipmentSchema.parse(req.body);

    // If name is being updated, check if new name already exists
    if (data.name && data.name !== existingEquipment.name) {
      const nameExists = await prisma.equipment.findUnique({
        where: { name: data.name },
      });

      if (nameExists) {
        return res.status(400).json({ error: 'Equipment with this name already exists' });
      }
    }

    const equipment = await prisma.equipment.update({
      where: { id },
      data,
    });

    console.log(`[EQUIPMENT] Equipment updated: ${equipment.name} by ${user.email}`);
    res.json(equipment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('[EQUIPMENT] Update equipment error:', error);
    res.status(500).json({ error: 'Failed to update equipment' });
  }
});

// DELETE /api/equipment/:id - Delete equipment (coach only)
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can delete equipment
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can delete equipment' });
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Delete image from Cloudinary if exists
    if (existingEquipment.imagePublicId) {
      try {
        await deleteImage(existingEquipment.imagePublicId as string);
      } catch (error) {
        console.warn('[EQUIPMENT] Failed to delete image from Cloudinary:', error);
      }
    }

    await prisma.equipment.delete({
      where: { id },
    });

    console.log(`[EQUIPMENT] Equipment deleted: ${existingEquipment.name} by ${user.email}`);
    res.json({ message: 'Equipment deleted successfully' });
  } catch (error) {
    console.error('[EQUIPMENT] Delete equipment error:', error);
    res.status(500).json({ error: 'Failed to delete equipment' });
  }
});

// POST /api/equipment/:id/upload-image - Upload equipment image (coach only)
router.post('/:id/upload-image', authenticate, upload.single('image'), async (req, res) => {
  try {
    const user = (req as any).user;
    const { id } = req.params;

    // Only coaches can upload equipment images
    if (user.role !== 'coach') {
      return res.status(403).json({ error: 'Only coaches can upload equipment images' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    // Check if equipment exists
    const existingEquipment = await prisma.equipment.findUnique({
      where: { id },
    });

    if (!existingEquipment) {
      return res.status(404).json({ error: 'Equipment not found' });
    }

    // Delete old image if exists
    if (existingEquipment.imagePublicId) {
      try {
        await deleteImage(existingEquipment.imagePublicId as string);
      } catch (error) {
        console.warn('[EQUIPMENT] Failed to delete old image:', error);
      }
    }

    // Upload new image
    const { url, publicId } = await uploadEquipmentImage(req.file.buffer, id);

    // Update equipment with new image URL
    const updatedEquipment = await prisma.equipment.update({
      where: { id },
      data: {
        imageUrl: url,
        imagePublicId: publicId,
      },
    });

    console.log(`[EQUIPMENT] Image uploaded for equipment: ${updatedEquipment.name} by ${user.email}`);
    res.json({
      imageUrl: url,
      imagePublicId: publicId,
      equipment: updatedEquipment,
    });
  } catch (error) {
    console.error('[EQUIPMENT] Upload image error:', error);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

export default router;
