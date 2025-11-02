import express from 'express';
// Import the new controller function
import { getBridgeCourse, getBridgeChapter, startFinalTest, submitFinalTest, submitBridgeExercise } from '../controllers/bridgeCourseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

router.get('/', getBridgeCourse);
router.get('/chapters/:chapterId', getBridgeChapter);
router.post('/final-test/start', startFinalTest);
router.post('/final-test/:testId/submit', submitFinalTest);

// Add the new route for submitting bridge course exercises
router.post('/exercises/:exerciseId/submit', submitBridgeExercise);

export default router;