import api from './index'; // Import the configured Axios instance

// We no longer need axios or the API_URL here

export const registerUser = (name, email, password) => {
  // Use the 'api' instance instead of 'axios'
  return api.post('/auth/register', { name, email, password });
};

export const loginUser = (email, password) => {
  return api.post('/auth/login', { email, password });
};