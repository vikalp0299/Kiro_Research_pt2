const bcrypt = require('bcrypt');

// Get salt rounds from environment or use default of 14
const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 14;

/**
 * Hash a password using bcrypt with configured salt rounds
 * @param {string} password - Plain text password to hash
 * @returns {Promise<string>} - Hashed password
 */
async function hashPassword(password) {
  try {
    const hash = await bcrypt.hash(password, SALT_ROUNDS);
    return hash;
  } catch (error) {
    throw new Error('Password hashing failed');
  }
}

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password to compare against
 * @returns {Promise<boolean>} - True if passwords match, false otherwise
 */
async function comparePassword(password, hash) {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    throw new Error('Password comparison failed');
  }
}

/**
 * Validate password strength according to security policy
 * @param {string} password - Password to validate
 * @returns {Object} - Validation result with isValid, strength, and errors
 */
function validatePasswordStrength(password) {
  const errors = [];
  
  // Check minimum length (12 characters)
  if (!password || password.length < 12) {
    errors.push('Password must be at least 12 characters long');
  }
  
  // Check for uppercase letter
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  // Check for lowercase letter
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  // Check for number
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  // Check for special character
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  // Calculate password strength
  let strength = 'weak';
  if (errors.length === 0) {
    // All requirements met
    if (password.length >= 16) {
      strength = 'strong';
    } else if (password.length >= 12) {
      strength = 'medium';
    }
  }
  
  return {
    isValid: errors.length === 0,
    strength: strength,
    errors: errors
  };
}

module.exports = {
  hashPassword,
  comparePassword,
  validatePasswordStrength
};
