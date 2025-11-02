import express from 'express';
import { submitExercise } from '../controllers/exerciseController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// All exercise routes are protected
router.use(protect);

// Route for submitting an answer to a specific exercise
router.post('/:exerciseId/submit', submitExercise);

export default router;