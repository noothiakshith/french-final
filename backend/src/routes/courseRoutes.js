import express from 'express';
// Import the new controller function
import { getMyChapters, getChapterById, getChapterProgress } from '../controllers/courseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(protect);

router.get('/chapters', getMyChapters);
router.get('/chapters/:chapterId', getChapterById);
router.get('/chapters/:chapterId/progress', getChapterProgress);

export default router;