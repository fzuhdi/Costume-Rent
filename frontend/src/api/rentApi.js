import api from './axios';

export const getRents = (params) =>
  api.get('/rents', { params });

export const getRentById = (id) =>
  api.get(`/rents/${id}`);

export const createRent = (data) =>
  api.post('/rents', data);

export const updateRent = (id, data) =>
  api.put(`/rents/${id}`, data);

export const markReturned = (id, data = {}) =>
  api.put(`/rents/${id}/return`, data);

export const markRented = (id, data = {}) =>
  api.put(`/rents/${id}/rent`, data);

export const markBooked = (id, data = {}) =>
  api.put(`/rents/${id}/book`, data);

export const uploadPaymentProof = (file) => {
  const formData = new FormData();
  formData.append('payment_proof', file);
  return api.post('/rents/upload-proof', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const cancelRent = (id) =>
  api.put(`/rents/${id}/cancel`);

export const deleteRent = (id) =>
  api.delete(`/rents/${id}`);