import api from './index';

/**
 * Fetches the list of all chapters for the logged-in user's curriculum.
 * @returns {Promise<object>} The response containing the array of chapters.
 */
export const getMyChapters = () => {
  return api.get('/course/chapters');
};

/**
 * Alias for getMyChapters - fetches all chapters for the user.
 * @returns {Promise<object>} The response containing the array of chapters.
 */
export const getChapters = () => {
  return api.get('/course/chapters');
};

/**
 * Fetches the progress summary for a specific chapter.
 * @param {string} chapterId
 * @returns {Promise<object>} The response containing the chapter progress data.
 */
export const getChapterProgress = (chapterId) => {
  return api.get(`/course/chapters/${chapterId}/progress`);
};

/**
 * Fetches a single chapter by its ID, including its lessons.
 * @param {string} chapterId
 * @returns {Promise<object>} The response containing the chapter data.
 */
export const getChapterById = (chapterId) => {
  return api.get(`/course/chapters/${chapterId}`);
};

/**
 * Fetches the full details of a single chapter, including its lessons and exercises.
 * @param {string} chapterId
 * @returns {Promise<object>} The response containing the full chapter data.
 */
export const getChapterDetails = (chapterId) => {
  return api.get(`/course/chapters/${chapterId}`);
};