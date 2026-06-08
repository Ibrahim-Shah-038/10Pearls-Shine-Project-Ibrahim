const BASE_URL = 'http://localhost:5172';
const API_URL = `${BASE_URL}/api`;

export const getBaseUrl = () => BASE_URL;

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/login';
    throw new Error('Session expired. Please log in again.');
  }

  // Check if response is a file (CSV export)
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('text/csv')) {
    return response.blob();
  }

  let data;
  try {
    data = await response.json();
  } catch (e) {
    data = null;
  }

  if (!response.ok) {
    const errorMsg = data?.message || data?.details || response.statusText || 'Request failed';
    throw new Error(errorMsg);
  }

  return data;
};

export const api = {
  get: async (endpoint) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },

  post: async (endpoint, body) => {
    const isFormData = body instanceof FormData;
    const headers = {
      ...getAuthHeaders(),
    };
    if (!isFormData) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'POST',
      headers,
      body: isFormData ? body : JSON.stringify(body),
    });
    return handleResponse(response);
  },

  put: async (endpoint, body) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(body),
    });
    return handleResponse(response);
  },

  delete: async (endpoint) => {
    const response = await fetch(`${API_URL}/${endpoint}`, {
      method: 'DELETE',
      headers: {
        ...getAuthHeaders(),
      },
    });
    return handleResponse(response);
  },
};
