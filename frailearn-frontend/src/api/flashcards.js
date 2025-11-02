import api from './index';

/**
 * Fetches the deck of flashcards due for review
 * @returns {Promise<object>} The response containing the flashcard deck
 */
export const getFlashcardReview = () => {
  return api.get('/flashcards/review');
};

/**
 * Submits a flashcard review response
 * @param {string} flashcardProgressId
 * @param {boolean} wasCorrect
 * @returns {Promise<object>} The response
 */
export const submitFlashcardReview = (flashcardProgressId, wasCorrect) => {
  return api.post(`/flashcards/review/${flashcardProgressId}`, { wasCorrect });
};