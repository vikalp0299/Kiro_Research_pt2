const { generateToken, verifyToken, blacklistToken, isTokenBlacklisted, authenticateToken } = require('../Middleware/auth');
const { hashPassword, comparePassword, validatePasswordStrength, validateEmail } = require('../Middleware/password');

describe('Authentication Middleware', () => {
  describe('JWT Token Functions', () => {
    test('should generate and verify token successfully', () => {
      const payload = { userID: 123, username: 'testuser' };
      const token = generateToken(payload);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      
      const decoded = verifyToken(token);
      expect(decoded.userID).toBe(123);
      expect(decoded.username).toBe('testuser');
    });

    test('should blacklist token successfully', () => {
      const token = 'test-token';
      
      expect(isTokenBlacklisted(token)).toBe(false);
      blacklistToken(token);
      expect(isTokenBlacklisted(token)).toBe(true);
    });

    test('should authenticate valid token', () => {
      const payload = { userID: 123, username: 'testuser' };
      const token = generateToken(payload);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {};
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(req.user).toBeDefined();
      expect(req.user.userID).toBe(123);
      expect(next).toHaveBeenCalled();
    });

    test('should reject request without token', () => {
      const req = { headers: {} };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Access token required',
        code: 'NO_TOKEN'
      });
      expect(next).not.toHaveBeenCalled();
    });

    test('should reject blacklisted token', () => {
      const payload = { userID: 123, username: 'testuser' };
      const token = generateToken(payload);
      blacklistToken(token);
      
      const req = {
        headers: {
          authorization: `Bearer ${token}`
        }
      };
      const res = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn()
      };
      const next = jest.fn();
      
      authenticateToken(req, res, next);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        message: 'Token has been invalidated',
        code: 'TOKEN_BLACKLISTED'
      });
      expect(next).not.toHaveBeenCalled();
    });
  });
});

describe('Password Middleware', () => {
  describe('Password Hashing', () => {
    test('should hash and compare password successfully', async () => {
      const password = 'TestPassword123!';
      const hashedPassword = await hashPassword(password);
      
      expect(hashedPassword).toBeDefined();
      expect(hashedPassword).not.toBe(password);
      
      const isMatch = await comparePassword(password, hashedPassword);
      expect(isMatch).toBe(true);
      
      const isWrongMatch = await comparePassword('WrongPassword', hashedPassword);
      expect(isWrongMatch).toBe(false);
    });
  });

  describe('Password Validation', () => {
    test('should validate strong password', () => {
      const result = validatePasswordStrength('StrongPassword123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Password is strong');
    });

    test('should reject short password', () => {
      const result = validatePasswordStrength('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('at least 10 characters');
    });

    test('should reject password without uppercase', () => {
      const result = validatePasswordStrength('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('uppercase letter');
    });

    test('should reject password without lowercase', () => {
      const result = validatePasswordStrength('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('lowercase letter');
    });

    test('should reject password without numbers', () => {
      const result = validatePasswordStrength('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('number');
    });

    test('should reject password without special characters', () => {
      const result = validatePasswordStrength('NoSpecialChars123');
      expect(result.isValid).toBe(false);
      expect(result.message).toContain('special character');
    });
  });

  describe('Email Validation', () => {
    test('should validate correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('test+tag@example.org')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
    });
  });
});