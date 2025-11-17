/**
 * Tests for Password Validation Utilities
 */

import {
  validatePassword,
  validateEmail,
  validateUsername,
  getStrengthColor,
  getStrengthLabel
} from '../passwordValidation';

describe('Password Validation', () => {
  describe('validatePassword', () => {
    test('should validate a strong password', () => {
      const password = 'StrongPassword123!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong'); // 18 chars = strong
      expect(result.errors).toHaveLength(0);
      expect(result.feedback.minLength).toBe(true);
      expect(result.feedback.hasUpper).toBe(true);
      expect(result.feedback.hasLower).toBe(true);
      expect(result.feedback.hasNumber).toBe(true);
      expect(result.feedback.hasSpecial).toBe(true);
    });

    test('should validate a very strong password (16+ characters)', () => {
      const password = 'VeryStrongPassword123!@#';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
      expect(result.errors).toHaveLength(0);
    });

    test('should reject password shorter than 12 characters', () => {
      const password = 'Short1!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('12 characters'))).toBe(true);
      expect(result.feedback.minLength).toBe(false);
    });

    test('should reject password without uppercase letter', () => {
      const password = 'lowercase123!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('uppercase'))).toBe(true);
      expect(result.feedback.hasUpper).toBe(false);
    });

    test('should reject password without lowercase letter', () => {
      const password = 'UPPERCASE123!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('lowercase'))).toBe(true);
      expect(result.feedback.hasLower).toBe(false);
    });

    test('should reject password without number', () => {
      const password = 'NoNumbersHere!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('number'))).toBe(true);
      expect(result.feedback.hasNumber).toBe(false);
    });

    test('should reject password without special character', () => {
      const password = 'NoSpecialChar123';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.some(e => e.includes('special character'))).toBe(true);
      expect(result.feedback.hasSpecial).toBe(false);
    });

    test('should reject password with multiple violations', () => {
      const password = 'weak';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors.length).toBeGreaterThan(1);
    });

    test('should handle null password', () => {
      const result = validatePassword(null);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors).toContain('Password is required');
    });

    test('should handle undefined password', () => {
      const result = validatePassword(undefined);
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors).toContain('Password is required');
    });

    test('should handle empty string password', () => {
      const result = validatePassword('');
      
      expect(result.isValid).toBe(false);
      expect(result.strength).toBe('weak');
      expect(result.errors).toContain('Password is required');
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
        const result = validatePassword(password);
        expect(result.isValid).toBe(true);
        expect(result.feedback.hasSpecial).toBe(true);
      });
    });

    test('should calculate medium strength for basic valid password', () => {
      const password = 'ValidPass123!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('medium');
    });

    test('should calculate strong strength for long password', () => {
      const password = 'VeryLongPassword123!';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong');
    });

    test('should calculate strong strength for password with multiple special chars', () => {
      const password = 'Password123!@#';
      const result = validatePassword(password);
      
      expect(result.isValid).toBe(true);
      expect(result.strength).toBe('strong'); // 14 chars with multiple numbers and special chars
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email format', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.com')).toBe(true);
    });

    test('should reject invalid email formats', () => {
      expect(validateEmail('invalid')).toBe(false);
      expect(validateEmail('invalid@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('test@domain')).toBe(false);
    });

    test('should reject null or undefined email', () => {
      expect(validateEmail(null)).toBe(false);
      expect(validateEmail(undefined)).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validateUsername', () => {
    test('should validate correct username', () => {
      const result = validateUsername('testuser');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should validate username with numbers', () => {
      const result = validateUsername('testuser123');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject username that is too short', () => {
      const result = validateUsername('ab');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('at least 3 characters'))).toBe(true);
    });

    test('should reject username that is too long', () => {
      const result = validateUsername('a'.repeat(21));
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('no more than 20 characters'))).toBe(true);
    });

    test('should reject username with special characters', () => {
      const result = validateUsername('test@user');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('letters and numbers'))).toBe(true);
    });

    test('should reject username with spaces', () => {
      const result = validateUsername('test user');
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.includes('letters and numbers'))).toBe(true);
    });

    test('should reject null or undefined username', () => {
      expect(validateUsername(null).isValid).toBe(false);
      expect(validateUsername(undefined).isValid).toBe(false);
      expect(validateUsername('').isValid).toBe(false);
    });
  });

  describe('getStrengthColor', () => {
    test('should return correct colors for strength levels', () => {
      expect(getStrengthColor('strong')).toBe('#22c55e');
      expect(getStrengthColor('medium')).toBe('#eab308');
      expect(getStrengthColor('weak')).toBe('#ef4444');
    });

    test('should return weak color for unknown strength', () => {
      expect(getStrengthColor('unknown')).toBe('#ef4444');
      expect(getStrengthColor('')).toBe('#ef4444');
    });
  });

  describe('getStrengthLabel', () => {
    test('should return correct labels for strength levels', () => {
      expect(getStrengthLabel('strong')).toBe('Strong');
      expect(getStrengthLabel('medium')).toBe('Medium');
      expect(getStrengthLabel('weak')).toBe('Weak');
    });

    test('should return weak label for unknown strength', () => {
      expect(getStrengthLabel('unknown')).toBe('Weak');
      expect(getStrengthLabel('')).toBe('Weak');
    });
  });
});
