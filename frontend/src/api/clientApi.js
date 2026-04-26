import api from './axios';

export const getClients = (params) =>
  api.get('/clients', { params });

export const getClientById = (id) =>
  api.get(`/clients/${id}`);

export const searchClients = (search, limit = 10) =>
  api.get('/clients/search', { params: { search, limit } });

export const createClient = (data) =>
  api.post('/clients', data);

export const updateClient = (id, data) =>
  api.put(`/clients/${id}`, data);

export const deleteClient = (id) =>
  api.delete(`/clients/${id}`);

export const getClientRents = (id) =>
  api.get(`/clients/${id}/rents`);