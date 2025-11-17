/**
 * Tests for Password Security Utilities
 */

const { hashPassword, comparePassword, validatePasswordStrength } = require('../password');

describe('Password Security Utilities', () => {
  describe('hashPassword', () => {
    test('should hash a password successfully', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
      expect(hash).not.toBe(password);
      expect(hash.startsWith('$2b$')).toBe(true);
    });

    test('should produce different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });

    test('should throw error for invalid input', async () => {
      await expect(hashPassword(null)).rejects.toThrow();
    });
  });

  describe('comparePassword', () => {
    test('should return true for correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const match = await comparePassword(password, hash);
      
      expect(match).toBe(true);
    });

    test('should return false for incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword456!';
      const hash = await hashPassword(password);
      const match = await comparePassword(wrongPassword, hash);
      
      expect(match).toBe(false);
    });

    test('should return false for slightly different password', async () => {
      const password = 'TestPassword123!';
      const similarPassword = 'TestPassword123';
      const hash = await hashPassword(password);
      const match = await comparePassword(similarPassword, hash);
      
      expect(match).toBe(false);
    });

    test('should return false for invalid hash format', async () => {
      const password = 'TestPassword123!';
      const match = await comparePassword(password, 'invalid-hash');
      
      expect(match).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    test('should validate a strong password', () => {
      const password = 'StrongPassword123!';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    test('should validate a very strong password (16+ characters)', () => {
      const password = 'VeryStrongPassword123!@#';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    test('should reject password shorter than 12 characters', () => {
      const password = 'Short1!';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('12 characters'))).toBe(true);
    });

    test('should reject password without uppercase letter', () => {
      const password = 'lowercase123!';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
    });

    test('should reject password without lowercase letter', () => {
      const password = 'UPPERCASE123!';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
    });

    test('should reject password without number', () => {
      const password = 'NoNumbersHere!';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
    });

    test('should reject password without special character', () => {
      const password = 'NoSpecialChar123';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('special character'))).toBe(true);
    });

    test('should reject password with multiple violations', () => {
      const password = 'weak';
      const result = validatePasswordStrength(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should handle null or undefined password', () => {
      const result1 = validatePasswordStrength(null);
      const result2 = validatePasswordStrength(undefined);
      
      expect(result1.isValid).toBe(false);
      expect(result2.isValid).toBe(false);
    });

    test('should handle empty string password', () => {
      const result = validatePasswordStrength('');
      
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('12 characters'))).toBe(true);
    });

    test('should accept various special characters', () => {
      const passwords = [
        'TestPassword123!',
        'TestPassword123@',
        'TestPassword123#',
        'TestPassword123$',
        'TestPassword123%',
        'TestPassword123^',
        'TestPassword123&',
        'TestPassword123*'
      ];
      
      passwords.forEach(password => {
        const result = validatePasswordStrength(password);
        expect(result.isValid).toBe(true);
      });
    });
  });
});
