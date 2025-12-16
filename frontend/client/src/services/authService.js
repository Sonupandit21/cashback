import api from './api';

// Login
export const login = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

// Register
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

// Get current user
export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Update user profile
export const updateProfile = async (userData) => {
  const response = await api.put('/users/profile', userData);
  return response.data;
};





















