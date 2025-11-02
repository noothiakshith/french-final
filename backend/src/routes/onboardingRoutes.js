import express from 'express';
import { skipTestAndStart } from '../controllers/onboardingController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// This route allows a logged-in user to select their level and generate their initial course.
// The 'protect' middleware ensures we know who the user is (req.user).
router.post('/skip-test', protect, skipTestAndStart);

export default router;