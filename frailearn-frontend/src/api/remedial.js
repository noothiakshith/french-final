import api from './index';

/**
 * Fetches all remedial chapters for the current user
 * @returns {Promise<object>} The response containing all remedial chapters
 */
export const getRemedialChapters = () => {
    return api.get('/remedial/chapters');
};

/**
 * Fetches a single remedial chapter by ID
 * @param {string} chapterId
 * @returns {Promise<object>} The response containing the remedial chapter details
 */
export const getRemedialChapter = (chapterId) => {
    return api.get(`/remedial/chapters/${chapterId}`);
};

/**
 * Submits an answer for a remedial exercise
 * @param {string} exerciseId
 * @param {string} userAnswer
 * @returns {Promise<object>} The grading result
 */
export const submitRemedialExercise = (exerciseId, userAnswer) => {
    return api.post(`/remedial/exercises/${exerciseId}/submit`, { userAnswer });
};

/**
 * Manually triggers a remedial check for the current user
 * @returns {Promise<object>} The response containing generated chapters info
 */
export const triggerRemedialCheck = () => {
    return api.post('/remedial/check');
};