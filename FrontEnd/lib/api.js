/**
 * API Client Utility
 * Handles all HTTP requests to the backend API
 */

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

/**
 * Custom error class for API errors
 */
class APIError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'APIError';
    this.status = status;
    this.data = data;
  }
}

/**
 * Get authentication token from localStorage
 * @returns {string|null} JWT token or null
 */
function getToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Set authentication token in localStorage
 * @param {string} token - JWT token
 */
function setToken(token) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('token', token);
}

/**
 * Remove authentication token from localStorage
 */
function removeToken() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('token');
}

/**
 * Make HTTP request to API
 * @param {string} endpoint - API endpoint (e.g., '/api/loginFunc/login')
 * @param {Object} options - Fetch options
 * @returns {Promise<Object>} Response data
 */
async function apiRequest(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  // Add authorization header if token exists
  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      throw new APIError(
        data.error || 'Request failed',
        response.status,
        data
      );
    }

    return data;
  } catch (error) {
    if (error instanceof APIError) {
      throw error;
    }
    
    // Network or other errors
    throw new APIError(
      error.message || 'Network error',
      0,
      null
    );
  }
}

/**
 * Authentication API
 */
export const auth = {
  /**
   * Register new user
   * @param {Object} userData - User registration data
   * @returns {Promise<Object>} Response with token
   */
  async register(userData) {
    const response = await apiRequest('/api/loginFunc/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    
    return response;
  },

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Response with token
   */
  async login(credentials) {
    const response = await apiRequest('/api/loginFunc/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    
    return response;
  },

  /**
   * Logout user
   * @returns {Promise<Object>} Response
   */
  async logout() {
    const response = await apiRequest('/api/loginFunc/logout', {
      method: 'POST',
    });
    
    removeToken();
    return response;
  },

  /**
   * Verify MFA code
   * @param {number} userId - User ID
   * @param {string} code - 6-digit MFA code
   * @returns {Promise<Object>} Response with token
   */
  async verifyMFA(userId, code) {
    const response = await apiRequest('/api/loginFunc/verify-mfa', {
      method: 'POST',
      body: JSON.stringify({ userId, code }),
    });
    
    if (response.accessToken) {
      setToken(response.accessToken);
    }
    
    return response;
  },

  /**
   * Resend MFA code
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Response
   */
  async resendMFA(userId) {
    return apiRequest('/api/loginFunc/resend-mfa', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    });
  },
};

/**
 * Classes API
 */
export const classes = {
  /**
   * Get all available classes
   * @returns {Promise<Object>} Available classes
   */
  async getAvailable() {
    return apiRequest('/api/classFunc/available', {
      method: 'GET',
    });
  },

  /**
   * Get enrolled classes
   * @returns {Promise<Object>} Enrolled classes
   */
  async getEnrolled() {
    return apiRequest('/api/classFunc/enrolled', {
      method: 'GET',
    });
  },

  /**
   * Get dropped classes
   * @returns {Promise<Object>} Dropped classes
   */
  async getDropped() {
    return apiRequest('/api/classFunc/dropped', {
      method: 'GET',
    });
  },

  /**
   * Enroll in a class
   * @param {string} classId - Class ID
   * @returns {Promise<Object>} Response
   */
  async enroll(classId) {
    return apiRequest('/api/classFunc/enroll', {
      method: 'POST',
      body: JSON.stringify({ classId }),
    });
  },

  /**
   * Unenroll from a class
   * @param {string} classId - Class ID
   * @returns {Promise<Object>} Response
   */
  async unenroll(classId) {
    return apiRequest('/api/classFunc/unenroll', {
      method: 'POST',
      body: JSON.stringify({ classId }),
    });
  },
};

/**
 * Token management utilities
 */
export const token = {
  get: getToken,
  set: setToken,
  remove: removeToken,
  isAuthenticated: () => !!getToken(),
};

export { APIError };
