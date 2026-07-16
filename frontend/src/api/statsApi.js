import api from './axios';

export const getDashboardStats = () => {
  return api.get('/stats/dashboard');
};

export const getRevenueChart = (filter = 'daily') => {
  return api.get('/stats/revenue', { params: { filter } });
};
