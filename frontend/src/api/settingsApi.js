import api from './axios';

export const getSettings = () =>
  api.get('/settings');

const updateSettingsInWorker = (data) => {
  if (typeof window === 'undefined' || typeof Worker === 'undefined') {
    return api.put('/settings', data);
  }

  const workerSource = `
    self.onmessage = async (event) => {
      const { data, token, url } = event.data;
      const headers = { 'Content-Type': 'application/json' };

      if (token) {
        headers.Authorization = 'Bearer ' + token;
      }

      try {
        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: JSON.stringify(data),
        });
        const text = await response.text();
        let payload = null;

        try {
          payload = text ? JSON.parse(text) : null;
        } catch (error) {
          payload = text;
        }

        self.postMessage({
          ok: response.ok,
          status: response.status,
          data: payload,
        });
      } catch (error) {
        self.postMessage({
          ok: false,
          message: error.message || 'Network request failed',
        });
      }
    };
  `;
  const workerUrl = URL.createObjectURL(new Blob([workerSource], { type: 'text/javascript' }));
  const worker = new Worker(workerUrl);
  const url = new URL('/api/settings', window.location.origin).toString();

  return new Promise((resolve, reject) => {
    const cleanup = () => {
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    };

    worker.onmessage = (event) => {
      cleanup();
      const result = event.data;

      if (result.ok) {
        resolve({ data: result.data });
        return;
      }

      if (result.status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }

      const error = new Error(result.message || 'Failed to update settings');
      error.response = {
        status: result.status,
        data: result.data,
      };
      reject(error);
    };

    worker.onerror = (error) => {
      cleanup();
      reject(error);
    };

    worker.postMessage({
      data,
      token: localStorage.getItem('token'),
      url,
    });
  });
};

export const updateSettings = (data) =>
  updateSettingsInWorker(data);

export const uploadLogo = (formData) =>
  api.post('/settings/logo', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
