/**
 * Password Validation Utilities
 * Validates password strength according to security policy
 */

/**
 * Validates password strength and returns detailed feedback
 * @param {string} password - Password to validate
 * @returns {Object} Validation result with isValid, strength, and errors
 */
export function validatePassword(password) {
  const errors = [];
  
  // Check if password exists
  if (!password) {
    return {
      isValid: false,
      strength: 'weak',
      errors: ['Password is required'],
      feedback: {
        minLength: false,
        hasUpper: false,
        hasLower: false,
        hasNumber: false,
        hasSpecial: false
      }
    };
  }
  
  // Check minimum length (12 characters)
  const minLength = password.length >= 12;
  if (!minLength) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Check for uppercase letter
  const hasUpper = /[A-Z]/.test(password);
  if (!hasUpper) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  const hasLower = /[a-z]/.test(password);
  if (!hasLower) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  const hasNumber = /\d/.test(password);
  if (!hasNumber) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  const hasSpecial = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
  if (!hasSpecial) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate password strength
  const strength = calculateStrength(password, {
    minLength,
    hasUpper,
    hasLower,
    hasNumber,
    hasSpecial
  });
  
  return {
    isValid: errors.length === 0,
    strength,
    errors,
    feedback: {
      minLength,
      hasUpper,
      hasLower,
      hasNumber,
      hasSpecial
    }
  };
}

/**
 * Calculates password strength based on criteria
 * @param {string} password - Password to evaluate
 * @param {Object} criteria - Validation criteria results
 * @returns {string} Strength level: 'weak', 'medium', or 'strong'
 */
function calculateStrength(password, criteria) {
  const { minLength, hasUpper, hasLower, hasNumber, hasSpecial } = criteria;
  
  // Count how many criteria are met
  const criteriaCount = [minLength, hasUpper, hasLower, hasNumber, hasSpecial].filter(Boolean).length;
  
  // All criteria must be met for valid password
  if (criteriaCount < 5) {
    return 'weak';
  }
  
  // Additional strength factors
  const hasMultipleNumbers = (password.match(/\d/g) || []).length >= 2;
  const hasMultipleSpecial = (password.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/g) || []).length >= 2;
  const isLongEnough = password.length >= 16;
  
  // Strong password: meets all requirements + additional factors
  if (isLongEnough || (hasMultipleNumbers && hasMultipleSpecial)) {
    return 'strong';
  }
  
  // Medium password: meets all basic requirements
  return 'medium';
}

/**
 * Validates email format
 * @param {string} email - Email address to validate
 * @returns {boolean} True if email format is valid
 */
export function validateEmail(email) {
  if (!email) return false;
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validates username format
 * @param {string} username - Username to validate
 * @returns {Object} Validation result
 */
export function validateUsername(username) {
  const errors = [];
  
  if (!username) {
    errors.push('Username is required');
  } else if (username.length < 3) {
    errors.push('Username must be at least 3 characters long');
  } else if (username.length > 20) {
    errors.push('Username must be no more than 20 characters long');
  } else if (!/^[a-zA-Z0-9]+$/.test(username)) {
    errors.push('Username must contain only letters and numbers');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Gets password strength color for UI display
 * @param {string} strength - Password strength level
 * @returns {string} Color code for the strength level
 */
export function getStrengthColor(strength) {
  switch (strength) {
    case 'strong':
      return '#22c55e'; // green
    case 'medium':
      return '#eab308'; // yellow
    case 'weak':
    default:
      return '#ef4444'; // red
  }
}

/**
 * Gets password strength label for UI display
 * @param {string} strength - Password strength level
 * @returns {string} Human-readable strength label
 */
export function getStrengthLabel(strength) {
  switch (strength) {
    case 'strong':
      return 'Strong';
    case 'medium':
      return 'Medium';
    case 'weak':
    default:
      return 'Weak';
  }
}
