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

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'https://rhinos-training-app-git-main-alexdanielmotognas-projects.vercel.app',
    'https://rhinos-training.at',
    'https://www.rhinos-training.at',
    process.env.FRONTEND_URL || '',
    /\.railway\.app$/,
    /\.vercel\.app$/,
  ].filter(Boolean),
  credentials: true
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
});
