import api from './axios';

export const login = (email, password) =>
  api.post('/auth/login', { email, password });

export const getCurrentUser = () =>
  api.get('/auth/me');

export const logout = () =>
  api.post('/auth/logout');

export const changePassword = (data) =>
  api.put('/auth/change-password', data);
