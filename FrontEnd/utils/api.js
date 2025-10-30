const API_BASE_URL = 'http://localhost:3001/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` })
  };
};

// Helper function to handle API responses
const handleResponse = async (response) => {
  const data = await response.json();
  return data;
};

// Authentication API functions
export const userLoginRequest = async (usernameOrEmail, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/loginFunc/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ usernameOrEmail, password }),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error during login');
  }
};

export const userRegisterRequest = async (fullName, email, username, password) => {
  try {
    const response = await fetch(`${API_BASE_URL}/loginFunc/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fullName, email, username, password }),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error during registration');
  }
};

export const userLogoutRequest = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/loginFunc/logout`, {
      method: 'POST',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error during logout');
  }
};

// Class management API functions
export const displayAllAvailableClasses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/classFunc/available`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error fetching available classes');
  }
};

export const displayEnrolledClasses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/classFunc/enrolled`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error fetching enrolled classes');
  }
};

export const displayDroppedClasses = async () => {
  try {
    const response = await fetch(`${API_BASE_URL}/classFunc/dropped`, {
      method: 'GET',
      headers: getAuthHeaders(),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error fetching dropped classes');
  }
};

export const enrollClass = async (classId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/classFunc/register`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ classId }),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error during class enrollment');
  }
};

export const unenrollClass = async (classId) => {
  try {
    const response = await fetch(`${API_BASE_URL}/classFunc/deregister`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ classId }),
    });
    return await handleResponse(response);
  } catch (error) {
    throw new Error('Network error during class unenrollment');
  }
};