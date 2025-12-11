import express from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import prisma from '../utils/prisma.js';
import { generateToken, generatePasswordResetToken, verifyPasswordResetToken } from '../utils/jwt.js';
import { sendPasswordResetEmail, sendWelcomeEmail } from '../utils/email.js';
import { loginLimiter, signupLimiter, passwordResetLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Validation schemas
const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(1),
  role: z.enum(['player', 'coach']),
  coachCode: z.string().optional(),
  jerseyNumber: z.number().optional(),
  birthDate: z.string().optional(),
  age: z.number().optional(),
  weightKg: z.number().optional(),
  heightCm: z.number().optional(),
  position: z.string().optional(),
  sex: z.enum(['male', 'female']).optional(),
  ageCategory: z.string().optional(),
  coachCategories: z.array(z.string()).optional(),
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

const forgotPasswordSchema = z.object({
  email: z.string().email(),
});

const resetPasswordSchema = z.object({
  token: z.string(),
  newPassword: z.string().min(6),
});

const COACH_CODE = process.env.COACH_CODE || 'RHINOS2025';

// POST /api/auth/signup
router.post('/signup', signupLimiter, async (req, res) => {
  try {
    const data = signupSchema.parse(req.body);

    // Validate coach code if signing up as coach
    if (data.role === 'coach') {
      if (!data.coachCode) {
        console.log(`[AUTH SECURITY] Coach signup attempt without code - Email: ${data.email}`);
        return res.status(400).json({ error: 'Coach code is required' });
      }

      if (data.coachCode !== COACH_CODE) {
        console.log(`[AUTH SECURITY] Invalid coach code attempt - Email: ${data.email}, Code: ${data.coachCode}`);
        return res.status(400).json({ error: 'Invalid coach code' });
      }

      console.log(`[AUTH SECURITY] Valid coach signup - Email: ${data.email}`);
    }

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email already registered' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(data.password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        name: data.name,
        role: data.role,
        jerseyNumber: data.jerseyNumber,
        birthDate: data.birthDate,
        age: data.age,
        weightKg: data.weightKg,
        heightCm: data.heightCm,
        position: data.position,
        sex: data.sex,
        ageCategory: data.ageCategory,
        coachCategories: data.coachCategories || [],
      },
    });

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Send welcome email (async, don't block response)
    sendWelcomeEmail(user.email, user.name).catch(err =>
      console.error('Failed to send welcome email:', err)
    );

    // Set httpOnly cookie with token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // 'lax' works with subdomain
      domain: process.env.NODE_ENV === 'production' ? '.rhinos-training.at' : undefined, // Share cookie across subdomain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jerseyNumber: user.jerseyNumber,
        position: user.position,
        age: user.age,
        weightKg: user.weightKg,
        heightCm: user.heightCm,
        sex: user.sex,
        metricsPublic: user.metricsPublic,
        ageCategory: user.ageCategory,
        coachCategories: user.coachCategories,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Failed to create account' });
  }
});

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash);

    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    // Generate JWT
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Set httpOnly cookie with token
    res.cookie('auth_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // 'lax' works with subdomain
      domain: process.env.NODE_ENV === 'production' ? '.rhinos-training.at' : undefined, // Share cookie across subdomain
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        jerseyNumber: user.jerseyNumber,
        birthDate: user.birthDate,
        position: user.position,
        age: user.age,
        weightKg: user.weightKg,
        heightCm: user.heightCm,
        sex: user.sex,
        phone: user.phone,
        instagram: user.instagram,
        snapchat: user.snapchat,
        tiktok: user.tiktok,
        hudl: user.hudl,
        metricsPublic: user.metricsPublic,
        aiCoachEnabled: user.aiCoachEnabled,
        ageCategory: user.ageCategory,
        coachCategories: user.coachCategories,
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/forgot-password
router.post('/forgot-password', passwordResetLimiter, async (req, res) => {
  try {
    const { email } = forgotPasswordSchema.parse(req.body);

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists or not (security)
      return res.json({ message: 'If the email exists, a reset link has been sent' });
    }

    // Generate reset token
    const resetToken = generatePasswordResetToken(user.id);

    // Save token to database with expiry
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
      },
    });

    // Send reset email (async, don't block response)
    sendPasswordResetEmail(email, resetToken).catch(err =>
      console.error('Failed to send password reset email:', err)
    );

    res.json({ message: 'If the email exists, a reset link has been sent' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request' });
  }
});

// POST /api/auth/reset-password
router.post('/reset-password', passwordResetLimiter, async (req, res) => {
  try {
    const { token, newPassword } = resetPasswordSchema.parse(req.body);

    // Verify token
    let userId: string;
    try {
      const decoded = verifyPasswordResetToken(token);
      userId = decoded.userId;
    } catch (error) {
      return res.status(400).json({ error: 'The reset link is invalid or has expired' });
    }

    // Find user with matching token
    const user = await prisma.user.findFirst({
      where: {
        id: userId,
        resetToken: token,
        resetTokenExpiry: {
          gte: new Date(), // Token not expired
        },
      },
    });

    if (!user) {
      return res.status(400).json({ error: 'The reset link has expired or has already been used' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    res.json({ message: 'Password reset successful' });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ error: 'Validation error', details: error.errors });
    }
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// POST /api/auth/logout
router.post('/logout', (req, res) => {
  // Clear the auth cookie
  res.clearCookie('auth_token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'lax' : 'lax', // Must match cookie settings
    domain: process.env.NODE_ENV === 'production' ? '.rhinos-training.at' : undefined, // Must match cookie settings
  });

  res.json({ message: 'Logged out successfully' });
});

export default router;
