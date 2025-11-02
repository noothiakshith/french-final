import express from 'express';
import { getDashboard, getUserStats, getProgressTestRecommendation } from '../controllers/userController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// The main dashboard endpoint
router.get('/dashboard', getDashboard);

// User statistics endpoint
router.get('/stats', getUserStats);

// Progress test recommendation endpoint
router.get('/progress-test-recommendation', getProgressTestRecommendation);

export default router;