import api from './axios';

export const getRents = (params) =>
  api.get('/rents', { params });

export const getRentById = (id) =>
  api.get(`/rents/${id}`);

export const createRent = (data) =>
  api.post('/rents', data);

export const updateRent = (id, data) =>
  api.put(`/rents/${id}`, data);

export const markReturned = (id) =>
  api.put(`/rents/${id}/return`);

export const deleteRent = (id) =>
  api.delete(`/rents/${id}`);