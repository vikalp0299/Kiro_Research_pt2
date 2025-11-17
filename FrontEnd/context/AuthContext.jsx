'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth, token } from '../lib/api';

const AuthContext = createContext(null);

/**
 * Authentication Context Provider
 * Manages authentication state and provides auth functions to the app
 */
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  /**
   * Check authentication status on mount
   * Verifies if user has a valid token
   */
  useEffect(() => {
    checkAuth();
  }, []);

  /**
   * Check if user is authenticated
   * Validates stored token and sets authentication state
   */
  const checkAuth = async () => {
    try {
      const storedToken = token.get();
      
      if (!storedToken) {
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Token exists, decode and verify it's not expired
      const payload = parseJwt(storedToken);
      
      if (!payload || isTokenExpired(payload)) {
        // Token is invalid or expired
        token.remove();
        setIsAuthenticated(false);
        setUser(null);
        setIsLoading(false);
        return;
      }

      // Token is valid
      setUser({
        userId: payload.userId,
        username: payload.username,
        email: payload.email
      });
      setIsAuthenticated(true);
      setIsLoading(false);
    } catch (error) {
      console.error('Auth check failed:', error);
      token.remove();
      setIsAuthenticated(false);
      setUser(null);
      setIsLoading(false);
    }
  };

  /**
   * Login user
   * @param {Object} credentials - Login credentials
   * @returns {Promise<Object>} Login response
   */
  const login = async (credentials) => {
    try {
      const response = await auth.login(credentials);
      
      // Check if MFA is required
      if (response.mfaRequired) {
        // MFA required - don't set user yet, return response for MFA flow
        return response;
      }
      
      // Login successful - token is already stored by the API client
      setUser({
        userId: response.user.userId,
        username: response.user.username,
        email: response.user.email
      });
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Register new user
   * @param {Object} userData - Registration data
   * @returns {Promise<Object>} Registration response
   */
  const register = async (userData) => {
    try {
      const response = await auth.register(userData);
      
      // Token is already stored by the API client
      setUser({
        userId: response.user.userId,
        username: response.user.username,
        email: response.user.email
      });
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Logout user
   * Clears authentication state and redirects to login
   */
  const logout = async () => {
    try {
      // Call logout API to blacklist token
      await auth.logout();
    } catch (error) {
      console.error('Logout API call failed:', error);
      // Continue with logout even if API call fails
    } finally {
      // Clear local state
      token.remove();
      setUser(null);
      setIsAuthenticated(false);
      
      // Redirect to login page
      router.push('/login');
    }
  };

  /**
   * Verify MFA code and complete login
   * @param {number} userId - User ID from login response
   * @param {string} code - 6-digit MFA code
   * @returns {Promise<Object>} Verification response
   */
  const verifyMFA = async (userId, code) => {
    try {
      const response = await auth.verifyMFA(userId, code);
      
      // MFA verified - token is stored by API client
      setUser({
        userId: response.user.userId,
        username: response.user.username,
        email: response.user.email
      });
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      throw error;
    }
  };

  /**
   * Resend MFA code
   * @param {number} userId - User ID
   * @returns {Promise<Object>} Resend response
   */
  const resendMFA = async (userId) => {
    try {
      return await auth.resendMFA(userId);
    } catch (error) {
      throw error;
    }
  };

  /**
   * Refresh authentication state
   * Re-checks authentication status
   */
  const refreshAuth = async () => {
    await checkAuth();
  };

  const value = {
    user,
    isAuthenticated,
    isLoading,
    login,
    register,
    logout,
    verifyMFA,
    resendMFA,
    refreshAuth
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Custom hook to access authentication context
 * @returns {Object} Authentication context value
 */
export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
}

/**
 * Parse JWT token payload
 * @param {string} token - JWT token
 * @returns {Object|null} Decoded payload or null
 */
function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to parse JWT:', error);
    return null;
  }
}

/**
 * Check if JWT token is expired
 * @param {Object} payload - Decoded JWT payload
 * @returns {boolean} True if token is expired
 */
function isTokenExpired(payload) {
  if (!payload.exp) {
    return true;
  }
  
  const currentTime = Math.floor(Date.now() / 1000);
  return payload.exp < currentTime;
}
