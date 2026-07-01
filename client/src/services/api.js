export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function parseResponse(response) {
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : null;

  if (!response.ok) {
    const message = payload?.message || payload?.error || `Request failed (${response.status})`;
    throw new Error(message);
  }

  return payload;
}

export async function apiRequest(path, options = {}) {
  const token = options.token;
  const body = options.body;
  const headers = {
    ...(body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers
  };

  try {
    return await parseResponse(
      await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        body: body instanceof FormData || typeof body === 'string' || body === undefined ? body : JSON.stringify(body)
      })
    );
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error('API server is not reachable. Start the backend and try again.');
    }
    throw error;
  }
}

export const authApi = {
  login(role, credentials) {
    return apiRequest(`/auth/${role}/login`, { method: 'POST', body: credentials });
  },
  register(role, formData) {
    return apiRequest(`/auth/${role}/register`, { method: 'POST', body: formData });
  }
};

export const dashboardApi = {
  get(role, token) {
    return apiRequest(`/dashboard/${role}`, { token });
  }
};

export const projectApi = {
  list() {
    return apiRequest('/projects');
  }
};

export const rankingApi = {
  list() {
    return apiRequest('/rankings');
  }
};

export const walletApi = {
  get(token) {
    return apiRequest('/wallet', { token });
  }
};
