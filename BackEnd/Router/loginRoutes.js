const express = require('express');
const router = express.Router();
const { 
  registerStudentUser, 
  loginStudentUser, 
  logoutStudentUser,
  verifyMFACode,
  resendMFACode,
  getMFAStatus,
  enableMFA,
  disableMFA
} = require('../Controller/loginController');
const { verifyToken } = require('../Middleware/auth');
const { authLimiter } = require('../Middleware/rateLimiter');

/**
 * POST /api/loginFunc/register
 * Register a new student user
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/register', authLimiter, registerStudentUser);

/**
 * POST /api/loginFunc/login
 * Login a student user
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/login', authLimiter, loginStudentUser);

/**
 * POST /api/loginFunc/logout
 * Logout a student user
 * Requires authentication
 */
router.post('/logout', verifyToken, logoutStudentUser);

/**
 * POST /api/loginFunc/verify-mfa
 * Verify MFA code and complete login
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/verify-mfa', authLimiter, verifyMFACode);

/**
 * POST /api/loginFunc/resend-mfa
 * Resend MFA code
 * Rate limited: 5 attempts per 15 minutes
 */
router.post('/resend-mfa', authLimiter, resendMFACode);

/**
 * GET /api/loginFunc/mfa-status
 * Get MFA status for logged-in user
 * Requires authentication
 */
router.get('/mfa-status', verifyToken, getMFAStatus);

/**
 * POST /api/loginFunc/enable-mfa
 * Enable MFA for logged-in user
 * Requires authentication
 */
router.post('/enable-mfa', verifyToken, enableMFA);

/**
 * POST /api/loginFunc/disable-mfa
 * Disable MFA for logged-in user
 * Requires authentication and password confirmation
 */
router.post('/disable-mfa', verifyToken, disableMFA);

module.exports = router;
