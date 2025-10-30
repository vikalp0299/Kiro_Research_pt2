import { validateEmail, validatePassword } from '../utils/validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('validates correct email formats', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name@domain.co.uk')).toBe(true);
      expect(validateEmail('user+tag@example.org')).toBe(true);
    });

    test('rejects invalid email formats', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('test.example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('validates strong passwords', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.message).toBe('Strong password');
    });

    test('rejects passwords that are too short', () => {
      const result = validatePassword('Short1!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must be at least 10 characters long');
    });

    test('rejects passwords without uppercase letters', () => {
      const result = validatePassword('lowercase123!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one uppercase letter');
    });

    test('rejects passwords without lowercase letters', () => {
      const result = validatePassword('UPPERCASE123!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one lowercase letter');
    });

    test('rejects passwords without numbers', () => {
      const result = validatePassword('NoNumbers!');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one number');
    });

    test('rejects passwords without special characters', () => {
      const result = validatePassword('NoSpecialChars123');
      expect(result.isValid).toBe(false);
      expect(result.message).toBe('Password must contain at least one special character');
    });
  });
});