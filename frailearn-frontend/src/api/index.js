import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const api = axios.create({
  baseURL: 'http://localhost:8000/api', // Your backend base URL
});

// This is the magic part: an interceptor that runs before every request.
api.interceptors.request.use(
  (config) => {
    // Get the token from our global Zustand store
    const token = useAuthStore.getState().token;
    console.log('API Interceptor - Token:', token ? 'Present' : 'Missing');
    console.log('API Interceptor - Request URL:', config.url);
    
    if (token) {
      // If a token exists, add it to the Authorization header
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;