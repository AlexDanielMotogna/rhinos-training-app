import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import userRoutes from './routes/users.js';
import uploadRoutes from './routes/upload.js';
import trainingRoutes from './routes/trainings.js';
import exerciseRoutes from './routes/exercises.js';
import templateRoutes from './routes/templates.js';
import assignmentRoutes from './routes/assignments.js';
import workoutRoutes from './routes/workouts.js';
import trainingTypeRoutes from './routes/trainingTypes.js';
import blockInfoRoutes from './routes/blockInfo.js';
import pointsConfigRoutes from './routes/pointsConfig.js';
import attendancePollRoutes from './routes/attendancePolls.js';
import notificationRoutes from './routes/notifications.js';
import adminRoutes from './routes/admin.js';
import testResultRoutes from './routes/testResults.js';
import videoRoutes from './routes/videos.js';
import videoTagRoutes from './routes/videoTags.js';
import drillRoutes from './routes/drills.js';
import equipmentRoutes from './routes/equipment.js';
import drillCategoryRoutes from './routes/drillCategories.js';
import drillTrainingSessionRoutes from './routes/drillTrainingSessions.js';
import teamSettingsRoutes from './routes/teamSettings.js';
import leaderboardRoutes from './routes/leaderboard.js';
import exerciseCategoryRoutes from './routes/exerciseCategories.js';
import reportsRoutes from './routes/reports.js';
import matchRoutes from './routes/matches.js';
import { startCronJobs } from './utils/cronJobs.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://rhinos-training-app-git-main-alexdanielmotognas-projects.vercel.app',
      'https://rhinos-training.at',
      'https://www.rhinos-training.at'
    ];

    // Check if origin is in allowed list or matches patterns
    if (allowedOrigins.includes(origin) ||
        origin.includes('.vercel.app') ||
        origin.includes('.railway.app')) {
      return callback(null, true);
    }

    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  preflightContinue: false,
  optionsSuccessStatus: 204
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/trainings', trainingRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/assignments', assignmentRoutes);
app.use('/api/workouts', workoutRoutes);
app.use('/api/training-types', trainingTypeRoutes);
app.use('/api/block-info', blockInfoRoutes);
app.use('/api/points-config', pointsConfigRoutes);
app.use('/api/attendance-polls', attendancePollRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/test-results', testResultRoutes);
app.use('/api/videos', videoRoutes);
app.use('/api/video-tags', videoTagRoutes);
app.use('/api/drills', drillRoutes);
app.use('/api/equipment', equipmentRoutes);
app.use('/api/drill-categories', drillCategoryRoutes);
app.use('/api/drill-training-sessions', drillTrainingSessionRoutes);
app.use('/api/team-settings', teamSettingsRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/exercise-categories', exerciseCategoryRoutes);
app.use('/api/reports', reportsRoutes);
app.use('/api/matches', matchRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal server error'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`[SERVER] Rhinos Training API running on http://localhost:${PORT}`);
  console.log(`[ENV] Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[CONFIG] Frontend URL: ${process.env.FRONTEND_URL}`);

  // Start cron jobs
  startCronJobs();
});
