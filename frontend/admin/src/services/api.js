import axios from 'axios';

// Create axios instance with default config
// In production (Netlify, etc.), set REACT_APP_API_BASE_URL to your backend URL (e.g. https://cashback-api.onrender.com/api)
// For local development, it falls back to '/api' which works with the CRA proxy setting.
const apiBaseURL = process.env.REACT_APP_API_BASE_URL || '/api';

// Log API base URL to help debug (always log in production to catch missing env vars)
console.log('API Base URL:', apiBaseURL);
if (!process.env.REACT_APP_API_BASE_URL) {
  console.warn('⚠️ REACT_APP_API_BASE_URL not set! API calls will use relative path /api');
  console.warn('Set REACT_APP_API_BASE_URL in Vercel Environment Variables to your Render backend URL');
}

const api = axios.create({
  baseURL: apiBaseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;





















