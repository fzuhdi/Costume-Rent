import { getErrorMessage } from '@/utils/errorMap';

const request = async (method, url, data, config = {}) => {
  const token = localStorage.getItem('token:v1');
  const headers = {
    ...config.headers,
  };
  
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let queryString = '';
  if (config.params) {
    // Remove undefined/null values
    const cleanParams = Object.fromEntries(
      Object.entries(config.params).filter(([_, v]) => v != null)
    );
    const searchParams = new URLSearchParams(cleanParams);
    queryString = `?${searchParams.toString()}`;
  }

  if (!headers['Content-Type'] && !(data instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  } else if (headers['Content-Type'] === 'multipart/form-data') {
    delete headers['Content-Type'];
  }

  let body = undefined;
  if (data) {
    body = data instanceof FormData ? data : JSON.stringify(data);
  }

  const response = await fetch(`/api${url}${queryString}`, {
    method,
    headers,
    body,
  });

  let responseData = null;
  if (response.status !== 204) {
    try {
      responseData = await response.json();
    } catch {
      // empty response
    }
  }

  if (!response.ok) {
    if (response.status === 401) {
      const isLoginRequest = url === '/auth/login';
      const isAuthCheck = url === '/auth/me';
      if (!isLoginRequest && !isAuthCheck && window.location.pathname !== '/login') {
        localStorage.removeItem('user:v1');
        localStorage.removeItem('token:v1');
        window.location.href = '/login';
      }
    }
    
    const error = new Error();
    error.response = { status: response.status, data: responseData };
    error.message = getErrorMessage(error) || response.statusText;
    throw error;
  }

  let unwrappedData = responseData;
  if (responseData && responseData.success === true) {
    unwrappedData = responseData.data !== undefined ? responseData.data : responseData;
  }

  return { data: unwrappedData, status: response.status };
};

const api = {
  get: (url, config) => request('GET', url, null, config),
  post: (url, data, config) => request('POST', url, data, config),
  put: (url, data, config) => request('PUT', url, data, config),
  delete: (url, config) => request('DELETE', url, null, config),
};

export default api;
