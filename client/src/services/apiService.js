// Simple localStorage service

// Custom error for HTTP 429 rate-limit responses
export class RateLimitError extends Error {
  constructor(message = 'Chat limit reached (50 messages per 24 hours)') {
    super(message);
    this.name = 'RateLimitError';
    this.isRateLimit = true;
  }
}
export const storageService = {
  set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
      console.error('Storage set error:', e);
    }
  },
  get(key) {
    try {
      const item = localStorage.getItem(key);
      if (!item) return null;
      return JSON.parse(item);
    } catch (e) {
      console.error('Storage get error:', e);
      return null;
    }
  },
  remove(key) {
    localStorage.removeItem(key);
  },
  clear() {
    localStorage.clear();
  },
};

const API_BASE = '/api';

class ApiService {
  constructor() {
    this.baseUrl = API_BASE;
    this.token = null;
    this.adminPath = null;
    this.adminPathPromise = null;
  }

  setToken(token) {
      this.token = token;
      if (token) {
        storageService.set("auth_token", token);
      } else {
        storageService.remove("auth_token");
      }
    }

  getToken() {
    if (!this.token) {
      // Get token from storageService which handles decryption
      const storageToken = storageService.get("auth_token");
      this.token = storageToken || null;
    }
    return this.token;
  }

  async request(endpoint, options = {}, retries = 5, backoff = 1000) {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getToken();
    
    const headers = {
      ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    };
    
    const config = {
      ...options,
      headers,
      credentials: 'include', // Include cookies for cross-origin requests
    };
    
    try {
      const response = await fetch(url, config);
      const data = await response.json().catch(() => ({}));
      
      if (!response.ok) {
        // Handle 429 Too Many Requests
        if (response.status === 429) {
          // AI chat/workflow endpoints must NOT retry — surface limit immediately
          const isAiEndpoint = endpoint.startsWith('/ai/workflow') ||
                               endpoint.startsWith('/ai/chat') ||
                               endpoint.startsWith('/ai/attachments');
          if (isAiEndpoint) {
            throw new RateLimitError(
              data.message || 'Chat limit reached (50 messages per 24 hours)'
            );
          }
          // For non-AI 429s, retry with exponential backoff as before
          if (retries > 0) {
            await new Promise(resolve => setTimeout(resolve, backoff));
            return this.request(endpoint, options, retries - 1, backoff * 2);
          }
          throw new RateLimitError(data.message || 'Too many requests. Please try again later.');
        }
        const validationDetails = Array.isArray(data.errors)
          ? data.errors.map(({ field, message }) => `${field}: ${message}`).join('; ')
          : '';
        throw new Error(validationDetails || data.message || `HTTP ${response.status}`);
      }
      
      return data;
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, body) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async upload(endpoint, file) {
    const formData = new FormData();
    formData.append('file', file);
    return this.request(endpoint, { method: 'POST', body: formData });
  }

  async put(endpoint, body) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async patch(endpoint, body) {
    return this.request(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }

  normalizeAdminEndpoint(endpoint = '') {
    const value = String(endpoint || '');
    return value.startsWith('/') ? value : `/${value}`;
  }

  async getAdminPath(forceRefresh = false) {
    if (!forceRefresh && this.adminPath) {
      return this.adminPath;
    }

    if (!forceRefresh && this.adminPathPromise) {
      return this.adminPathPromise;
    }

    this.adminPathPromise = this.get('/auth/admin-path')
      .then((response) => {
        const path = response?.data?.adminPath;

        if (!path || typeof path !== 'string') {
          throw new Error('Invalid admin path configuration');
        }

        this.adminPath = path.trim().replace(/^\/+|\/+$/g, '');

        if (!this.adminPath) {
          throw new Error('Empty admin path configuration');
        }

        return this.adminPath;
      })
      .finally(() => {
        this.adminPathPromise = null;
      });

    return this.adminPathPromise;
  }

  async adminRequest(endpoint, options = {}) {
    const adminPath = await this.getAdminPath();
    const adminEndpoint = this.normalizeAdminEndpoint(endpoint);
    return this.request(`/${adminPath}${adminEndpoint}`, options);
  }

  async adminGet(endpoint) {
    return this.adminRequest(endpoint, { method: 'GET' });
  }

  async adminPost(endpoint, body) {
    return this.adminRequest(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async adminPut(endpoint, body) {
    return this.adminRequest(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async adminUpload(endpoint, file, fieldName = 'file', fields = {}) {
    const formData = new FormData();
    formData.append(fieldName, file);
    Object.entries(fields).forEach(([key, value]) => formData.append(key, value));
    return this.adminRequest(endpoint, { method: 'POST', body: formData });
  }

  async adminDelete(endpoint, body) {
    return this.adminRequest(endpoint, {
      method: 'DELETE',
      ...(body ? { body: JSON.stringify(body) } : {}),
    });
  }

  // Sanitize input to prevent XSS
  sanitize(str) {
    if (typeof str !== 'string') return '';
    return str
      .replace(/[<>\"'`]/g, '')
      .trim();
  }

  // Validate email format
  validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const apiService = new ApiService();