import express from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);

// Private route - Note the use of the 'protect' middleware
// The 'protect' function runs first. If it succeeds, 'getMe' runs next.
router.get('/me', protect, getMe);

export default router;