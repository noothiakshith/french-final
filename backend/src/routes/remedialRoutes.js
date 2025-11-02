import express from 'express';
import { triggerRemedialCheck, getRemedialChapter, getRemedialChapters, submitRemedialExercise, forceGenerateRemedial } from '../controllers/remedialController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// Endpoint to manually trigger the mistake analysis for the logged-in user
router.post('/check', triggerRemedialCheck);

// Endpoint to force generate a remedial chapter for testing
router.post('/force-generate', forceGenerateRemedial);

// Endpoint to get all remedial chapters for the user
router.get('/chapters', getRemedialChapters);

// Endpoint to get a single remedial chapter
router.get('/chapters/:chapterId', getRemedialChapter);

// Endpoint to submit a remedial exercise answer
router.post('/exercises/:exerciseId/submit', submitRemedialExercise);

export default router;