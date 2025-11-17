const crypto = require('crypto');

/**
 * MFA (Multi-Factor Authentication) Utilities
 * Handles OTP generation, validation, and management
 */

/**
 * Generate a 6-digit OTP code
 * @returns {string} 6-digit numeric code
 */
function generateOTP() {
  // Generate a random 6-digit number
  const otp = crypto.randomInt(100000, 999999).toString();
  return otp;
}

/**
 * Generate OTP with expiration time
 * @returns {Object} Object containing code and expiration timestamp
 */
function generateOTPWithExpiry() {
  const code = generateOTP();
  const expiresAt = Date.now() + (10 * 60 * 1000); // 10 minutes from now
  
  return {
    code,
    expiresAt,
    createdAt: Date.now()
  };
}

/**
 * Verify if OTP code is valid and not expired
 * @param {string} providedCode - Code provided by user
 * @param {string} storedCode - Code stored in database
 * @param {number} expiresAt - Expiration timestamp
 * @returns {Object} Validation result
 */
function verifyOTP(providedCode, storedCode, expiresAt) {
  const now = Date.now();
  
  // Check if code has expired
  if (now > expiresAt) {
    return {
      valid: false,
      reason: 'expired',
      message: 'OTP code has expired. Please request a new code.'
    };
  }
  
  // Check if codes match
  if (providedCode !== storedCode) {
    return {
      valid: false,
      reason: 'invalid',
      message: 'Invalid OTP code. Please try again.'
    };
  }
  
  return {
    valid: true,
    message: 'OTP verified successfully'
  };
}

/**
 * Check if OTP is still valid (not expired)
 * @param {number} expiresAt - Expiration timestamp
 * @returns {boolean} True if OTP is still valid
 */
function isOTPValid(expiresAt) {
  return Date.now() < expiresAt;
}

/**
 * Get remaining time for OTP in seconds
 * @param {number} expiresAt - Expiration timestamp
 * @returns {number} Remaining seconds (0 if expired)
 */
function getOTPRemainingTime(expiresAt) {
  const remaining = Math.floor((expiresAt - Date.now()) / 1000);
  return remaining > 0 ? remaining : 0;
}

/**
 * Send OTP via email using AWS SNS
 * @param {string} email - Recipient email address
 * @param {string} code - OTP code to send
 * @param {string} username - Username for personalization
 * @returns {Promise<Object>} Send result
 */
async function sendOTPEmail(email, code, username) {
  const { sendEmailViaSNS } = require('../services/snsService');
  
  const subject = 'Your Verification Code - Class Registration App';
  const message = `Hello ${username},

Your Class Registration App verification code is: ${code}

This code will expire in 10 minutes.

If you didn't request this code, please ignore this email.

- Class Registration Team`;

  const result = await sendEmailViaSNS(email, subject, message);
  
  return {
    ...result,
    // In development mode, return the code for testing
    ...(process.env.NODE_ENV === 'development' && { code })
  };
}

/**
 * Send OTP via SMS using AWS SNS
 * @param {string} phoneNumber - Recipient phone number (E.164 format: +1234567890)
 * @param {string} code - OTP code to send
 * @returns {Promise<Object>} Send result
 */
async function sendOTPSMS(phoneNumber, code) {
  const { sendSMSViaSNS } = require('../services/snsService');
  
  const message = `Your Class Registration App verification code is: ${code}. This code expires in 10 minutes.`;
  
  const result = await sendSMSViaSNS(phoneNumber, message);
  
  return {
    ...result,
    // In development mode, return the code for testing
    ...(process.env.NODE_ENV === 'development' && { code })
  };
}

module.exports = {
  generateOTP,
  generateOTPWithExpiry,
  verifyOTP,
  isOTPValid,
  getOTPRemainingTime,
  sendOTPEmail,
  sendOTPSMS
};
