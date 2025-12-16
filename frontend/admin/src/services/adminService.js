import api from './api';

// Admin Auth
export const adminLogin = async (email, password) => {
  const response = await api.post('/auth/login', { email, password });
  return response.data;
};

export const adminRegister = async (userData) => {
  const response = await api.post('/auth/register', { ...userData, role: 'admin' });
  return response.data;
};

// Admin Stats
export const getAdminStats = async () => {
  const response = await api.get('/admin/stats');
  return response.data;
};

// Offers Management
export const getAdminOffers = async () => {
  const response = await api.get('/admin/offers');
  return response.data;
};

export const createOffer = async (formData) => {
  const response = await api.post('/admin/offers', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const updateOffer = async (id, formData) => {
  const response = await api.put(`/admin/offers/${id}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

export const deleteOffer = async (id) => {
  const response = await api.delete(`/admin/offers/${id}`);
  return response.data;
};

// Users Management
export const getUsers = async () => {
  const response = await api.get('/admin/users');
  return response.data;
};

// Transactions
export const getTransactions = async () => {
  const response = await api.get('/admin/transactions');
  return response.data;
};

// Trackier Statistics
export const getTrackierStats = async (params = {}) => {
  try {
    // Build query string only if params exist
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    const response = await api.get(`/admin/trackier/stats${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error in getTrackierStats:', error);
    throw error;
  }
};

export const getTrackierClicks = async (params = {}) => {
  try {
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    const response = await api.get(`/admin/trackier/clicks${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error in getTrackierClicks:', error);
    throw error;
  }
};

export const getTrackierInstalls = async (params = {}) => {
  try {
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    const response = await api.get(`/admin/trackier/installs${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error in getTrackierInstalls:', error);
    throw error;
  }
};

export const getTrackierPayouts = async (params = {}) => {
  try {
    const queryString = Object.keys(params).length > 0 
      ? `?${new URLSearchParams(params).toString()}`
      : '';
    const response = await api.get(`/admin/trackier/payouts${queryString}`);
    return response.data;
  } catch (error) {
    console.error('Error in getTrackierPayouts:', error);
    throw error;
  }
};

// Delete Trackier Records
export const deleteClick = async (id) => {
  const response = await api.delete(`/admin/trackier/clicks/${id}`);
  return response.data;
};

export const deleteInstall = async (id) => {
  const response = await api.delete(`/admin/trackier/installs/${id}`);
  return response.data;
};

export const deletePayout = async (id) => {
  const response = await api.delete(`/admin/trackier/payouts/${id}`);
  return response.data;
};











