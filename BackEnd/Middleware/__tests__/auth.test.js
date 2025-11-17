const jwt = require('jsonwebtoken');
const {
  generateTokens,
  blacklistToken,
  isTokenBlacklisted,
  verifyToken,
  clearBlacklist
} = require('../auth');

// Set up test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-256-bits';
process.env.JWT_ISSUER = 'class-registration-app';
process.env.JWT_AUDIENCE = 'class-registration-users';
process.env.JWT_EXPIRES_IN = '30m';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';

describe('JWT Token Management', () => {
  beforeEach(() => {
    // Clear blacklist before each test
    clearBlacklist();
  });

  describe('generateTokens', () => {
    test('should generate access and refresh tokens with all required claims', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      const tokens = generateTokens(payload);

      expect(tokens).toHaveProperty('accessToken');
      expect(tokens).toHaveProperty('refreshToken');
      expect(typeof tokens.accessToken).toBe('string');
      expect(typeof tokens.refreshToken).toBe('string');

      // Decode tokens to verify claims
      const decodedAccess = jwt.decode(tokens.accessToken);
      const decodedRefresh = jwt.decode(tokens.refreshToken);

      // Verify access token claims
      expect(decodedAccess.userId).toBe(payload.userId);
      expect(decodedAccess.username).toBe(payload.username);
      expect(decodedAccess.email).toBe(payload.email);
      expect(decodedAccess.type).toBe('access');
      expect(decodedAccess.iss).toBe('class-registration-app');
      expect(decodedAccess.aud).toBe('class-registration-users');
      expect(decodedAccess.exp).toBeDefined();
      expect(decodedAccess.iat).toBeDefined();

      // Verify refresh token claims
      expect(decodedRefresh.userId).toBe(payload.userId);
      expect(decodedRefresh.username).toBe(payload.username);
      expect(decodedRefresh.email).toBe(payload.email);
      expect(decodedRefresh.type).toBe('refresh');
      expect(decodedRefresh.iss).toBe('class-registration-app');
      expect(decodedRefresh.aud).toBe('class-registration-users');
    });

    test('should set correct expiration times for access and refresh tokens', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      const tokens = generateTokens(payload);

      const decodedAccess = jwt.decode(tokens.accessToken);
      const decodedRefresh = jwt.decode(tokens.refreshToken);

      // Calculate expected expiration times (with 5 second tolerance)
      const now = Math.floor(Date.now() / 1000);
      const expectedAccessExp = now + (30 * 60); // 30 minutes
      const expectedRefreshExp = now + (7 * 24 * 60 * 60); // 7 days

      // Verify expiration times are approximately correct
      expect(decodedAccess.exp).toBeGreaterThanOrEqual(expectedAccessExp - 5);
      expect(decodedAccess.exp).toBeLessThanOrEqual(expectedAccessExp + 5);
      
      expect(decodedRefresh.exp).toBeGreaterThanOrEqual(expectedRefreshExp - 5);
      expect(decodedRefresh.exp).toBeLessThanOrEqual(expectedRefreshExp + 5);

      // Verify refresh token expires after access token
      expect(decodedRefresh.exp).toBeGreaterThan(decodedAccess.exp);
    });

    test('should throw error when required payload fields are missing', () => {
      expect(() => generateTokens({ userId: 123 })).toThrow('Missing required token payload fields');
      expect(() => generateTokens({ username: 'test' })).toThrow('Missing required token payload fields');
      expect(() => generateTokens({ email: 'test@example.com' })).toThrow('Missing required token payload fields');
      expect(() => generateTokens({})).toThrow('Missing required token payload fields');
    });

    test('should throw error when JWT_SECRET is not set', () => {
      const originalSecret = process.env.JWT_SECRET;
      delete process.env.JWT_SECRET;

      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      expect(() => generateTokens(payload)).toThrow('JWT_SECRET environment variable is not set');

      process.env.JWT_SECRET = originalSecret;
    });
  });

  describe('blacklistToken and isTokenBlacklisted', () => {
    test('should add token to blacklist', () => {
      const token = 'test-token-123';

      expect(isTokenBlacklisted(token)).toBe(false);
      
      blacklistToken(token);
      
      expect(isTokenBlacklisted(token)).toBe(true);
    });

    test('should handle multiple tokens in blacklist', () => {
      const token1 = 'token-1';
      const token2 = 'token-2';
      const token3 = 'token-3';

      blacklistToken(token1);
      blacklistToken(token2);

      expect(isTokenBlacklisted(token1)).toBe(true);
      expect(isTokenBlacklisted(token2)).toBe(true);
      expect(isTokenBlacklisted(token3)).toBe(false);
    });

    test('should return false for null or undefined token', () => {
      expect(isTokenBlacklisted(null)).toBe(false);
      expect(isTokenBlacklisted(undefined)).toBe(false);
      expect(isTokenBlacklisted('')).toBe(false);
    });

    test('should throw error when blacklisting null or undefined token', () => {
      expect(() => blacklistToken(null)).toThrow('Token is required for blacklisting');
      expect(() => blacklistToken(undefined)).toThrow('Token is required for blacklisting');
      expect(() => blacklistToken('')).toThrow('Token is required for blacklisting');
    });
  });

  describe('verifyToken middleware', () => {
    test('should verify valid token and attach user info to request', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      const tokens = generateTokens(payload);

      const req = {
        headers: {
          authorization: `Bearer ${tokens.accessToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(req.user).toBeDefined();
      expect(req.user.userId).toBe(payload.userId);
      expect(req.user.username).toBe(payload.username);
      expect(req.user.email).toBe(payload.email);
      expect(req.user.type).toBe('access');
    });

    test('should reject request with missing authorization header', () => {
      const req = {
        headers: {}
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Authentication required' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject request with invalid authorization header format', () => {
      const req = {
        headers: {
          authorization: 'InvalidFormat token123'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid authorization header format' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject blacklisted token', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      const tokens = generateTokens(payload);
      blacklistToken(tokens.accessToken);

      const req = {
        headers: {
          authorization: `Bearer ${tokens.accessToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Token has been revoked' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject invalid token', () => {
      const req = {
        headers: {
          authorization: 'Bearer invalid-token-string'
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject expired token', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      // Generate token with immediate expiration
      const expiredToken = jwt.sign(
        { ...payload, type: 'access' },
        process.env.JWT_SECRET,
        {
          expiresIn: '0s',
          issuer: process.env.JWT_ISSUER,
          audience: process.env.JWT_AUDIENCE
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${expiredToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      // Wait a moment to ensure token is expired
      setTimeout(() => {
        verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith({ error: 'Token has expired' });
        expect(next).not.toHaveBeenCalled();
      }, 100);
    });

    test('should reject token with wrong issuer', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      const wrongIssuerToken = jwt.sign(
        { ...payload, type: 'access' },
        process.env.JWT_SECRET,
        {
          expiresIn: '30m',
          issuer: 'wrong-issuer',
          audience: process.env.JWT_AUDIENCE
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${wrongIssuerToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject token with wrong audience', () => {
      const payload = {
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      };

      const wrongAudienceToken = jwt.sign(
        { ...payload, type: 'access' },
        process.env.JWT_SECRET,
        {
          expiresIn: '30m',
          issuer: process.env.JWT_ISSUER,
          audience: 'wrong-audience'
        }
      );

      const req = {
        headers: {
          authorization: `Bearer ${wrongAudienceToken}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();

      verifyToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ error: 'Invalid token' });
      expect(next).not.toHaveBeenCalled();
    });
  });
});
