
import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import compression from 'compression';
import { startScheduledTasks } from './services/schedulerService.js';
import bridgeCourseRoutes from './routes/bridgeCourseRoutes.js';
import remedialRoutes from './routes/remedialRoutes.js';
import authRoutes from './routes/authRoutes.js';
import onboardingRoutes from './routes/onboardingRoutes.js';
import courseRoutes from './routes/courseRoutes.js';
import exerciseRoutes from './routes/exerciseRoutes.js';
import lessonRoutes from './routes/lessonRoutes.js';
import userRoutes from './routes/userRoutes.js';
import flashcardRoutes from './routes/flashcardRoutes.js';
dotenv.config();

const app = express();
const port = process.env.PORT || 8000;

// --- Global Middleware ---
app.use(compression()); // Enable gzip compression
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public')); // Serve static files from public directory

// Disable caching for API responses to ensure real-time updates
app.use('/api', (req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

import testRoutes from './routes/testRoutes.js';

// --- Routes ---
app.use('/api/auth', authRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/course', courseRoutes);
app.use('/api/tests', testRoutes);
app.use('/api/flashcards', flashcardRoutes);
app.use('/api/bridge-course', bridgeCourseRoutes);
app.use('/api/users', userRoutes);

// Serve test page
app.get('/test', (req, res) => {
  res.sendFile('test.html', { root: './public' });
});
app.use('/api/exercises', exerciseRoutes);
app.use('/api/lessons', lessonRoutes);
app.use('/api/remedial', remedialRoutes); // <-- ADD THIS
// --- Health Check Route ---
app.get('/', (req, res) => {
  res.send('FrAIlearn API is running...');
});

// --- Start Server ---
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
  
  // Start scheduled tasks after server is running
  startScheduledTasks();
});