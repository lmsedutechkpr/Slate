import { buildApiUrl } from '../config.js';

// Centralized API utility functions
export const api = {
  // GET request
  get: async (endpoint, options = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'GET',
      ...options,
    });
    return response;
  },

  // POST request
  post: async (endpoint, data, options = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  },

  // PUT request
  put: async (endpoint, data, options = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  },

  // DELETE request
  delete: async (endpoint, options = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'DELETE',
      ...options,
    });
    return response;
  },

  // PATCH request
  patch: async (endpoint, data, options = {}) => {
    const url = buildApiUrl(endpoint);
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });
    return response;
  },
};

// Helper to add auth headers
export const withAuth = (options = {}) => {
  const token = localStorage.getItem('accessToken');
  return {
    ...options,
    headers: {
      ...options.headers,
      Authorization: token ? `Bearer ${token}` : '',
    },
  };
};
