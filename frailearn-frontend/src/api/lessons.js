import api from './index';

/**
 * Fetches the full details of a single lesson, including its exercises.
 * @param {string} lessonId
 * @returns {Promise<object>} The response containing the full lesson data.
 */
export const getLessonDetails = (lessonId) => {
  // NOTE: We need to create this backend endpoint.
  // For now, we will assume it exists. If not, we will need to add it.
  return api.get(`/lessons/${lessonId}`);
};

/**
 * Submits an answer for a single exercise.
 * @param {string} exerciseId
 * @param {string} userAnswer
 * @returns {Promise<object>} The grading result.
 */
export const submitExerciseAnswer = (exerciseId, userAnswer) => {
  return api.post(`/exercises/${exerciseId}/submit`, { userAnswer });
};