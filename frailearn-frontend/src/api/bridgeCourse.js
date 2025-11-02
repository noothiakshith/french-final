import api from './index';

/**
 * Fetches the bridge course data for the logged-in user
 * @returns {Promise<object>} The response containing bridge course chapters
 */
export const getBridgeCourse = () => {
  return api.get('/bridge-course/');
};

/**
 * Fetches a single bridge course chapter by ID
 * @param {string} chapterId
 * @returns {Promise<object>} The response containing the chapter details
 */
export const getBridgeChapter = (chapterId) => {
  return api.get(`/bridge-course/chapters/${chapterId}`);
};

/**
 * Submits an answer for a bridge course exercise
 * @param {string} exerciseId
 * @param {string} userAnswer
 * @returns {Promise<object>} The grading result
 */
export const submitBridgeExercise = (exerciseId, userAnswer) => {
  return api.post(`/bridge-course/exercises/${exerciseId}/submit`, { userAnswer });
};

/**
 * Starts the final bridge course test
 * @returns {Promise<object>} The test data
 */
export const startBridgeFinalTest = () => {
  return api.post('/bridge-course/final-test/start');
};

/**
 * Submits the bridge course final test answers
 * @param {string} testId
 * @param {Array} answers
 * @returns {Promise<object>} The test result
 */
export const submitBridgeFinalTest = (testId, answers) => {
  return api.post(`/bridge-course/final-test/${testId}/submit`, { answers });
};