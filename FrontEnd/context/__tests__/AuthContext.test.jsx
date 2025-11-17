import { renderHook, act, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../AuthContext';
import { auth, token } from '../../lib/api';

// Mock dependencies
jest.mock('next/navigation', () => ({
  useRouter: jest.fn()
}));

jest.mock('../../lib/api', () => ({
  auth: {
    login: jest.fn(),
    register: jest.fn(),
    logout: jest.fn()
  },
  token: {
    get: jest.fn(),
    set: jest.fn(),
    remove: jest.fn()
  }
}));

describe('AuthContext', () => {
  let mockRouter;

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockRouter = {
      push: jest.fn()
    };
    useRouter.mockReturnValue(mockRouter);
  });

  const wrapper = ({ children }) => <AuthProvider>{children}</AuthProvider>;

  describe('useAuth hook', () => {
    test('should throw error when used outside AuthProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      
      expect(() => {
        renderHook(() => useAuth());
      }).toThrow('useAuth must be used within an AuthProvider');
      
      consoleSpy.mockRestore();
    });

    test('should provide auth context when used within AuthProvider', () => {
      token.get.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      expect(result.current).toHaveProperty('user');
      expect(result.current).toHaveProperty('isAuthenticated');
      expect(result.current).toHaveProperty('isLoading');
      expect(result.current).toHaveProperty('login');
      expect(result.current).toHaveProperty('register');
      expect(result.current).toHaveProperty('logout');
      expect(result.current).toHaveProperty('refreshAuth');
    });
  });

  describe('Authentication state', () => {
    test('should initialize with unauthenticated state when no token exists', async () => {
      token.get.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });

    test('should initialize with authenticated state when valid token exists', async () => {
      const mockToken = createMockToken({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600 // Expires in 1 hour
      });
      
      token.get.mockReturnValue(mockToken);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    test('should clear authentication when token is expired', async () => {
      const mockToken = createMockToken({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) - 3600 // Expired 1 hour ago
      });
      
      token.get.mockReturnValue(mockToken);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(token.remove).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    test('should login user and update authentication state', async () => {
      token.get.mockReturnValue(null);
      
      const mockResponse = {
        user: {
          userId: 123,
          username: 'testuser',
          email: 'test@example.com'
        },
        accessToken: 'mock-token'
      };
      
      auth.login.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.login({
          identifier: 'testuser',
          password: 'password123'
        });
      });
      
      expect(auth.login).toHaveBeenCalledWith({
        identifier: 'testuser',
        password: 'password123'
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com'
      });
    });

    test('should throw error when login fails', async () => {
      token.get.mockReturnValue(null);
      
      const mockError = new Error('Invalid credentials');
      auth.login.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await expect(async () => {
        await act(async () => {
          await result.current.login({
            identifier: 'testuser',
            password: 'wrongpassword'
          });
        });
      }).rejects.toThrow('Invalid credentials');
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('register', () => {
    test('should register user and update authentication state', async () => {
      token.get.mockReturnValue(null);
      
      const mockResponse = {
        user: {
          userId: 456,
          username: 'newuser',
          email: 'new@example.com'
        },
        accessToken: 'mock-token'
      };
      
      auth.register.mockResolvedValue(mockResponse);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.register({
          username: 'newuser',
          fullName: 'New User',
          email: 'new@example.com',
          password: 'SecurePass123!'
        });
      });
      
      expect(auth.register).toHaveBeenCalledWith({
        username: 'newuser',
        fullName: 'New User',
        email: 'new@example.com',
        password: 'SecurePass123!'
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        userId: 456,
        username: 'newuser',
        email: 'new@example.com'
      });
    });

    test('should throw error when registration fails', async () => {
      token.get.mockReturnValue(null);
      
      const mockError = new Error('Username already exists');
      auth.register.mockRejectedValue(mockError);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await expect(async () => {
        await act(async () => {
          await result.current.register({
            username: 'existinguser',
            fullName: 'Existing User',
            email: 'existing@example.com',
            password: 'SecurePass123!'
          });
        });
      }).rejects.toThrow('Username already exists');
      
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
    });
  });

  describe('logout', () => {
    test('should logout user and clear authentication state', async () => {
      const mockToken = createMockToken({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      
      token.get.mockReturnValue(mockToken);
      auth.logout.mockResolvedValue({ message: 'Logout successful' });
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(auth.logout).toHaveBeenCalled();
      expect(token.remove).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });

    test('should clear state even if logout API call fails', async () => {
      const mockToken = createMockToken({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      
      token.get.mockReturnValue(mockToken);
      auth.logout.mockRejectedValue(new Error('Network error'));
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      await act(async () => {
        await result.current.logout();
      });
      
      expect(token.remove).toHaveBeenCalled();
      expect(result.current.isAuthenticated).toBe(false);
      expect(result.current.user).toBe(null);
      expect(mockRouter.push).toHaveBeenCalledWith('/login');
    });
  });

  describe('refreshAuth', () => {
    test('should re-check authentication status', async () => {
      token.get.mockReturnValue(null);
      
      const { result } = renderHook(() => useAuth(), { wrapper });
      
      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
      
      expect(result.current.isAuthenticated).toBe(false);
      
      // Update mock to return a valid token
      const mockToken = createMockToken({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com',
        exp: Math.floor(Date.now() / 1000) + 3600
      });
      token.get.mockReturnValue(mockToken);
      
      await act(async () => {
        await result.current.refreshAuth();
      });
      
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user).toEqual({
        userId: 123,
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });
});

/**
 * Helper function to create a mock JWT token
 * @param {Object} payload - Token payload
 * @returns {string} Mock JWT token
 */
function createMockToken(payload) {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = btoa(JSON.stringify(header));
  const encodedPayload = btoa(JSON.stringify(payload));
  const signature = 'mock-signature';
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}
