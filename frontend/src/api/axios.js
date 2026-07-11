import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token:v1');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      const isLoginRequest = error.config?.url === '/auth/login';
      const isAuthCheck = error.config?.url === '/auth/me';
      if (!isLoginRequest && !isAuthCheck && window.location.pathname !== '/login') {
        localStorage.removeItem('user:v1');
        localStorage.removeItem('token:v1');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
