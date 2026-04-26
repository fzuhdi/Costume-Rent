import api from './axios';

export const getSettings = () =>
  api.get('/settings');

export const updateSettings = (data) =>
  api.put('/settings', data);

export const uploadLogo = (formData) =>
  api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });