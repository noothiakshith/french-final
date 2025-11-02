import api from './index';

/**
 * Fetches the user dashboard data
 * @returns {Promise<object>} The dashboard data
 */
export const getDashboard = () => {
  return api.get('/users/dashboard');
};

/**
 * Fetches detailed user statistics
 * @returns {Promise<object>} The user statistics
 */
export const getUserStats = () => {
  return api.get('/users/stats');
};

/**
 * Checks if user should take a progress test
 * @returns {Promise<object>} Progress test recommendation
 */
export const getProgressTestRecommendation = () => {
  return api.get('/users/progress-test-recommendation');
};