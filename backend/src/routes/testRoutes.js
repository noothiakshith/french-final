import express from 'express';
import {
    startPlacementTest,
    submitPlacementTest,
    startProgressTest,
    submitProgressTest,
    checkPlacementTestStatus,
} from '../controllers/testController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// --- All routes require authentication ---
router.use(protect);

// --- Placement Test Routes ---
router.get('/placement/status', checkPlacementTestStatus);
router.post('/placement/start', startPlacementTest);
router.post('/placement/:testId/submit', submitPlacementTest);

// --- Progress Test Routes ---
router.post('/progress/start', startProgressTest);
router.post('/progress/:testId/submit', submitProgressTest); // ✅ New route

export default router;
