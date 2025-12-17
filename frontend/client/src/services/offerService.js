import api from './api';

// Get all offers
export const getOffers = async (params = {}) => {
  const { featured, limit, category, isActive } = params;
  const queryParams = new URLSearchParams();
  
  if (featured) queryParams.append('featured', featured);
  if (limit) queryParams.append('limit', limit);
  if (category) queryParams.append('category', category);
  if (isActive !== undefined) queryParams.append('isActive', isActive);
  
  const response = await api.get(`/offers?${queryParams.toString()}`);
  return response.data;
};

// Get single offer by ID
export const getOfferById = async (id) => {
  const response = await api.get(`/offers/${id}`);
  return response.data;
};

// Claim an offer
export const claimOffer = async (offerId, upiId) => {
  const response = await api.post(`/offers/${offerId}/claim`, { upiId });
  return response.data;
};






















