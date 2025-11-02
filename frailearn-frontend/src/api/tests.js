import api from './index';

/**
 * Submits the placement test answers
 * @param {string} testId
 * @param {Array} answers
 * @returns {Promise<object>} The test result
 */
export const submitPlacementTest = (testId, answers) => {
  return api.post(`/tests/placement/${testId}/submit`, { answers });
};

/**
 * Starts a progress test for a specific chapter range
 * @param {string} range - e.g., "1-5" for chapters 1-5
 * @param {string} level - e.g., "BEGINNER", "INTERMEDIATE", "ADVANCED"
 * @returns {Promise<object>} The test data with testId and questions
 */
export const startProgressTest = (range, level = 'BEGINNER') => {
  return api.post(`/tests/progress/start`, { chapterRange: range, level });
};

/**
 * Submits the progress test answers
 * @param {string} testId
 * @param {Array} answers
 * @returns {Promise<object>} The test result
 */
export const submitProgressTest = (testId, answers) => {
  return api.post(`/tests/progress/${testId}/submit`, { answers });
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