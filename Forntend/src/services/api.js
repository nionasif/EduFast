/**
 * Centralized API Client for EduFast
 * Supports token injection, automatic error handling, and 401 session expiry redirects.
 */

export const getCustomServerUrl = () => {
  if (typeof window !== 'undefined') {
    const custom = localStorage.getItem('edufast_custom_server_url');
    if (custom && custom.trim()) {
      return custom.trim().replace(/\/+$/, '');
    }
    // If native Capacitor on mobile (or running as file/capacitor protocol)
    const isCapacitor = window.Capacitor?.isNativePlatform?.() || window.location?.protocol === 'capacitor:';
    if (isCapacitor) {
      return 'https://edufast-sp6h.onrender.com';
    }
    // If running in production (Vercel, custom domain, etc.)
    if (window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
      return (import.meta.env.VITE_SOCKET_URL || 'https://edufast-sp6h.onrender.com').replace(/\/+$/, '');
    }
  }
  return (import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000').replace(/\/+$/, '');
};

export const getApiBaseUrl = () => {
  return `${getCustomServerUrl()}/api`;
};

// Exported base URL for backward-compatibility
export const API_BASE_URL = getApiBaseUrl();

export const getToken = (rolePreference) => {
  if (typeof window === 'undefined') return null;

  // Specific role token check first
  if (rolePreference) {
    const roleKey = `${rolePreference.toLowerCase()}Token`;
    const specificToken = localStorage.getItem(roleKey);
    if (specificToken) return specificToken;
  }

  // Unified or common token keys
  const token =
    localStorage.getItem('authToken') ||
    localStorage.getItem('edufast_token') ||
    localStorage.getItem('studentToken') ||
    localStorage.getItem('teacherToken') ||
    localStorage.getItem('mentorToken') ||
    localStorage.getItem('adminToken');

  if (token) return token;

  // Check stored sessions for embedded token
  const sessionKeys = [
    'edufast_student_session',
    'edufast_teacher_session',
    'edufast_mentor_session',
    'edufast_admin_session',
    'edufast_authUser'
  ];

  for (const key of sessionKeys) {
    try {
      const raw = localStorage.getItem(key);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed?.token) return parsed.token;
      }
    } catch {}
  }

  return null;
};

export const setAuthSession = (token, user, role = 'student') => {
  if (typeof window === 'undefined') return;
  const lowerRole = (role || 'student').toLowerCase();
  
  localStorage.setItem('authToken', token);
  localStorage.setItem('edufast_token', token);
  localStorage.setItem(`${lowerRole}Token`, token);
  
  const userPayload = { ...user, token, role: lowerRole };
  localStorage.setItem('edufast_authUser', JSON.stringify(userPayload));
  localStorage.setItem(`edufast_${lowerRole}_session`, JSON.stringify(userPayload));

  window.dispatchEvent(new CustomEvent('auth:login_success', { detail: { user: userPayload, role: lowerRole } }));
};

export const clearAuthSession = (role) => {
  if (typeof window === 'undefined') return;
  if (role) {
    const lowerRole = role.toLowerCase();
    localStorage.removeItem(`${lowerRole}Token`);
    localStorage.removeItem(`edufast_${lowerRole}_session`);
  } else {
    localStorage.removeItem('authToken');
    localStorage.removeItem('edufast_token');
    localStorage.removeItem('studentToken');
    localStorage.removeItem('teacherToken');
    localStorage.removeItem('mentorToken');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('edufast_authUser');
    localStorage.removeItem('edufast_student_session');
    localStorage.removeItem('edufast_teacher_session');
    localStorage.removeItem('edufast_mentor_session');
    localStorage.removeItem('edufast_admin_session');
  }
};

/**
 * Custom Error class with server response details
 */
export class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Universal Request Dispatcher
 */
async function request(endpoint, options = {}) {
  const {
    method = 'GET',
    body,
    headers = {},
    params,
    role,
    skipAuth = false,
    ...customOptions
  } = options;

  let url = endpoint;
  if (!url.startsWith('http://') && !url.startsWith('https://')) {
    let cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    if (cleanEndpoint.startsWith('/api/')) {
      cleanEndpoint = cleanEndpoint.slice(4);
    }
    if (!cleanEndpoint.startsWith('/')) {
      cleanEndpoint = `/${cleanEndpoint}`;
    }
    url = `${getApiBaseUrl()}${cleanEndpoint}`;
  }

  // Append query parameters if provided
  if (params && typeof params === 'object') {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        query.append(key, String(val));
      }
    });
    const queryString = query.toString();
    if (queryString) {
      url += (url.includes('?') ? '&' : '?') + queryString;
    }
  }

  const reqHeaders = { ...headers };

  // Set Authorization Header
  if (!skipAuth) {
    const token = getToken(role);
    if (token && !reqHeaders['Authorization']) {
      reqHeaders['Authorization'] = `Bearer ${token}`;
    }
  }

  // JSON Body Handling
  let formattedBody = body;
  const isFormData = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body && !isFormData && typeof body === 'object') {
    reqHeaders['Content-Type'] = 'application/json';
    formattedBody = JSON.stringify(body);
  }

  const response = await fetch(url, {
    method,
    headers: reqHeaders,
    body: formattedBody,
    ...customOptions
  });

  // Handle 401 Unauthorized globally
  if (response.status === 401) {
    console.warn(`[API] 401 Unauthorized on ${endpoint}. Clearing credentials.`);
    clearAuthSession(role);
    window.dispatchEvent(new CustomEvent('auth:unauthorized', { detail: { endpoint, role } }));
  }

  // Parse response
  let data = null;
  const contentType = response.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    try {
      data = await response.json();
    } catch {
      data = null;
    }
  } else {
    try {
      data = await response.text();
    } catch {
      data = null;
    }
  }

  if (!response.ok) {
    const errorMessage =
      (data && (data.error || data.message)) ||
      `Request failed with status ${response.status}`;
    throw new ApiError(errorMessage, response.status, data);
  }

  // Provide dual compatibility: callers using Axios pattern `res.data.success`
  // and callers using fetch pattern `res.success` or `res.data` array
  if (data && typeof data === 'object') {
    const proxy = new Proxy(data, {
      get(target, prop) {
        if (prop === 'data') {
          const innerData = target.data !== undefined ? target.data : target;
          if (innerData && typeof innerData === 'object') {
            return new Proxy(innerData, {
              get(subTarget, subProp) {
                if (subProp in subTarget) return subTarget[subProp];
                if (subProp in target) return target[subProp];
                return undefined;
              }
            });
          }
          return innerData;
        }
        return target[prop];
      }
    });
    return proxy;
  }

  return data;
}


export const api = {
  get: (endpoint, options) => request(endpoint, { ...options, method: 'GET' }),
  post: (endpoint, body, options) => request(endpoint, { ...options, method: 'POST', body }),
  put: (endpoint, body, options) => request(endpoint, { ...options, method: 'PUT', body }),
  patch: (endpoint, body, options) => request(endpoint, { ...options, method: 'PATCH', body }),
  delete: (endpoint, options) => request(endpoint, { ...options, method: 'DELETE' }),
  upload: (endpoint, formData, options) => request(endpoint, { ...options, method: 'POST', body: formData }),
  getBaseUrl: () => API_BASE_URL,
  getToken,
  setAuthSession,
  clearAuthSession
};

export default api;
