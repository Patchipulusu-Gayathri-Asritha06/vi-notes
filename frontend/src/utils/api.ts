import axios from 'axios';

// On Render, VITE_API_URL will be set to your backend service URL
// Locally it falls back to localhost:5000
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach token from localStorage on every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('vi_notes_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('vi_notes_token');
      localStorage.removeItem('vi_notes_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;