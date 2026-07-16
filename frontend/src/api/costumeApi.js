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

export const deleteCostumeImage = (costumeId, imageId) =>
  api.delete(`/costumes/${costumeId}/images/${imageId}`);




export const getRegions = () =>
  api.get('/regions');


export const getCategories = () =>
  api.get('/categories');
