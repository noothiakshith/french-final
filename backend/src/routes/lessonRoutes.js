import express from 'express';
import { getLessonById } from '../controllers/lessonController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All lesson routes are protected
router.use(protect);

// Route for getting a single lesson by ID
router.get('/:lessonId', getLessonById);

export default router;