import api from './axios';

export const getCostumes = (params) =>
  api.get('/costumes', { params });

export const getCostumeById = (id) =>
  api.get(`/costumes/${id}`);

export const createCostume = (data) =>
  api.post('/costumes', data);

export const updateCostume = (id, data) =>
  api.put(`/costumes/${id}`, data);

export const deleteCostume = (id) =>
  api.delete(`/costumes/${id}`);

export const uploadCostumeImage = (id, formData) =>
  api.post(`/costumes/${id}/images`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteCostumeImage = (id, imageId) =>
  api.delete(`/costumes/${id}/images/${imageId}`);

export const searchCostumes = (q, limit = 10) =>
  api.get('/costumes/search', { params: { q, limit } });

export const getRegions = () =>
  api.get('/regions');

export const createRegion = (name) =>
  api.post('/regions', { name });

export const getCategories = () =>
  api.get('/categories');

export const createCategory = (name) =>
  api.post('/categories', { name });