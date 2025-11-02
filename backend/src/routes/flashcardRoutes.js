import express from 'express';
import { getReviewDeck, submitReview } from '../controllers/flashcardController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();
router.use(protect);

// Gets the cards due for review today
router.get('/review', getReviewDeck);

// Submits the result of a single card review
router.post('/review/:flashcardProgressId', submitReview);

export default router;