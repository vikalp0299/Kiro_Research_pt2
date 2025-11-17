/**
 * Tests for Environment Variable Validation
 */

const { validateEnvironment, getConfig } = require('../envValidator');

describe('Environment Variable Validation', () => {
  let originalEnv;

  beforeEach(() => {
    // Save original environment
    originalEnv = { ...process.env };
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('JWT Configuration', () => {
    test('should fail when JWT_SECRET is too short', () => {
      process.env.JWT_SECRET = 'short';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('JWT_SECRET'))).toBe(true);
    });

    test('should pass when JWT_SECRET is 32+ characters', () => {
      setValidEnvironment();
      process.env.JWT_SECRET = 'a'.repeat(32);
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
    });

    test('should fail when JWT_EXPIRES_IN has invalid format', () => {
      setValidEnvironment();
      process.env.JWT_EXPIRES_IN = 'invalid';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('JWT_EXPIRES_IN'))).toBe(true);
    });

    test('should pass when JWT_EXPIRES_IN has valid format', () => {
      setValidEnvironment();
      process.env.JWT_EXPIRES_IN = '30m';
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
    });
  });

  describe('AWS Configuration', () => {
    test('should fail when AWS credentials are missing', () => {
      setValidEnvironment();
      delete process.env.AWS_ACCESS_KEY_ID;
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('AWS_ACCESS_KEY_ID'))).toBe(true);
    });

    test('should fail when AWS_REGION has invalid format', () => {
      setValidEnvironment();
      process.env.AWS_REGION = 'invalid-region';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('AWS_REGION'))).toBe(true);
    });

    test('should pass when AWS_REGION has valid format', () => {
      setValidEnvironment();
      process.env.AWS_REGION = 'us-east-1';
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
    });
  });

  describe('Security Configuration', () => {
    test('should fail when BCRYPT_SALT_ROUNDS is below 10', () => {
      setValidEnvironment();
      process.env.BCRYPT_SALT_ROUNDS = '8';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BCRYPT_SALT_ROUNDS'))).toBe(true);
    });

    test('should fail when BCRYPT_SALT_ROUNDS is above 20', () => {
      setValidEnvironment();
      process.env.BCRYPT_SALT_ROUNDS = '25';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('BCRYPT_SALT_ROUNDS'))).toBe(true);
    });

    test('should pass when BCRYPT_SALT_ROUNDS is 14', () => {
      setValidEnvironment();
      process.env.BCRYPT_SALT_ROUNDS = '14';
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
    });

    test('should fail when rate limit values are not positive numbers', () => {
      setValidEnvironment();
      process.env.RATE_LIMIT_MAX_REQUESTS = '-1';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('RATE_LIMIT_MAX_REQUESTS'))).toBe(true);
    });
  });

  describe('Application Configuration', () => {
    test('should fail when NODE_ENV has invalid value', () => {
      setValidEnvironment();
      process.env.NODE_ENV = 'invalid';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('NODE_ENV'))).toBe(true);
    });

    test('should fail when PORT is out of range', () => {
      setValidEnvironment();
      process.env.PORT = '70000';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
    });

    test('should fail when FRONTEND_URL is not a valid URL', () => {
      setValidEnvironment();
      process.env.FRONTEND_URL = 'not-a-url';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('FRONTEND_URL'))).toBe(true);
    });
  });

  describe('CORS Configuration', () => {
    test('should fail when ALLOWED_ORIGINS contains invalid URLs', () => {
      setValidEnvironment();
      process.env.ALLOWED_ORIGINS = 'http://valid.com,invalid-url';
      const result = validateEnvironment();
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('ALLOWED_ORIGINS'))).toBe(true);
    });

    test('should pass when ALLOWED_ORIGINS contains valid URLs', () => {
      setValidEnvironment();
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000,https://example.com';
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
    });
  });

  describe('getConfig', () => {
    test('should return properly structured config object', () => {
      setValidEnvironment();
      const config = getConfig();
      
      expect(config).toHaveProperty('jwt');
      expect(config).toHaveProperty('aws');
      expect(config).toHaveProperty('app');
      expect(config).toHaveProperty('security');
      expect(config).toHaveProperty('cors');
      expect(config).toHaveProperty('database');
      
      expect(config.jwt.secret).toBe(process.env.JWT_SECRET);
      expect(config.app.port).toBe(parseInt(process.env.PORT, 10));
      expect(config.security.bcryptSaltRounds).toBe(parseInt(process.env.BCRYPT_SALT_ROUNDS, 10));
      expect(Array.isArray(config.cors.allowedOrigins)).toBe(true);
    });
  });

  describe('Complete validation', () => {
    test('should pass when all required variables are valid', () => {
      setValidEnvironment();
      const result = validateEnvironment();
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });
});

/**
 * Helper function to set a valid environment for testing
 */
function setValidEnvironment() {
  process.env.JWT_SECRET = 'a'.repeat(32);
  process.env.JWT_EXPIRES_IN = '30m';
  process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  process.env.JWT_ISSUER = 'test-app';
  process.env.JWT_AUDIENCE = 'test-users';
  process.env.AWS_ACCESS_KEY_ID = 'test-key-id';
  process.env.AWS_SECRET_ACCESS_KEY = 'test-secret-key';
  process.env.AWS_REGION = 'us-east-1';
  process.env.NODE_ENV = 'development';
  process.env.PORT = '3000';
  process.env.FRONTEND_URL = 'http://localhost:3001';
  process.env.BCRYPT_SALT_ROUNDS = '14';
  process.env.RATE_LIMIT_WINDOW_MS = '900000';
  process.env.RATE_LIMIT_MAX_REQUESTS = '100';
  process.env.AUTH_RATE_LIMIT_MAX = '5';
  process.env.ALLOWED_ORIGINS = 'http://localhost:3001';
}
