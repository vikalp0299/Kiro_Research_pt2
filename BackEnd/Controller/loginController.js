const { hashPassword, validatePasswordStrength, comparePassword } = require('../Middleware/password');
const { generateTokens, blacklistToken } = require('../Middleware/auth');
const { userExistsInDB, getUserByIdentifier, getUserById, pushUserData, updateMFAPreference, getMFAPreference } = require('../database/userOperations');
const { logAuthAttempt } = require('../Middleware/logger');
const { ValidationError, UnauthorizedError, ConflictError } = require('../Middleware/errors');
const { subscribeEmailToSNS } = require('../services/snsService');
const { generateOTPWithExpiry, sendOTPEmail, verifyOTP } = require('../Middleware/mfa');
const { storeMFACode, getMFACode, incrementMFAAttempts, lockMFACode, deleteMFACode } = require('../database/mfaOperations');

/**
 * Register a new student user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function registerStudentUser(req, res) {
  try {
    const { username, fullName, email, password } = req.body;

    // Validate input format
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: username, fullName, email, password' 
      });
    }

    // Validate username format (alphanumeric, 3-20 characters)
    if (!/^[a-zA-Z0-9]{3,20}$/.test(username)) {
      return res.status(400).json({ 
        error: 'Username must be 3-20 alphanumeric characters' 
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ 
        error: 'Invalid email format' 
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({ 
        error: 'Password does not meet security requirements',
        details: passwordValidation.errors
      });
    }

    // Check for existing username
    const existingUsername = await userExistsInDB(username);
    if (existingUsername) {
      return res.status(409).json({ 
        error: 'Username already exists' 
      });
    }

    // Check for existing email
    const existingEmail = await userExistsInDB(email);
    if (existingEmail) {
      return res.status(409).json({ 
        error: 'Email already exists' 
      });
    }

    // Hash password
    const hashedPassword = await hashPassword(password);

    // Store user in database
    const userId = await pushUserData({
      username,
      fullName,
      email,
      password: hashedPassword
    });

    // Subscribe user's email to SNS for MFA notifications
    const snsResult = await subscribeEmailToSNS(email);
    console.log(`SNS subscription for ${email}:`, snsResult.message);

    // Generate JWT tokens
    const tokens = generateTokens({
      userId,
      username,
      email
    });

    // Return success response with tokens and user info
    return res.status(201).json({
      message: 'User registered successfully',
      user: {
        userId,
        username,
        fullName,
        email
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      snsSubscription: snsResult.subscribed ? 'Please check your email to confirm SNS subscription for MFA' : 'SNS not configured'
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during registration' 
    });
  }
}

/**
 * Login a student user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function loginStudentUser(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             'unknown';

  try {
    const { identifier, password } = req.body;

    // Validate input
    if (!identifier || !password) {
      return res.status(400).json({ 
        error: 'Missing required fields: identifier and password' 
      });
    }

    // Retrieve user from database (by username or email)
    const user = await getUserByIdentifier(identifier);

    // If user doesn't exist, return generic error to prevent enumeration
    if (!user) {
      logAuthAttempt(identifier, false, ip, { reason: 'user_not_found' });
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Compare password with stored hash
    const passwordMatch = await comparePassword(password, user.password);

    // If password doesn't match, return generic error
    if (!passwordMatch) {
      logAuthAttempt(identifier, false, ip, { reason: 'invalid_password', userId: user.userId });
      return res.status(401).json({ 
        error: 'Invalid credentials' 
      });
    }

    // Check if MFA is enabled for this user
    const mfaEnabled = await getMFAPreference(user.userId);

    if (!mfaEnabled) {
      // MFA is disabled - complete login without MFA
      const tokens = generateTokens({
        userId: user.userId,
        username: user.username,
        email: user.email
      });

      logAuthAttempt(identifier, true, ip, { 
        userId: user.userId,
        mfaSkipped: true
      });

      return res.status(200).json({
        message: 'Login successful',
        user: {
          userId: user.userId,
          username: user.username,
          fullName: user.fullName,
          email: user.email,
          mfaEnabled: false
        },
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken
      });
    }

    // Password is correct and MFA is enabled - require MFA
    // Generate OTP code
    const otpData = generateOTPWithExpiry();
    
    // Store OTP in database
    await storeMFACode(user.userId, otpData.code, otpData.expiresAt);
    
    // Send OTP via email
    const sendResult = await sendOTPEmail(user.email, otpData.code, user.username);
    
    console.log(`MFA code sent to ${user.email}:`, sendResult.message);

    // Log MFA initiated
    logAuthAttempt(identifier, false, ip, { 
      reason: 'mfa_required', 
      userId: user.userId,
      step: 'password_verified'
    });

    // Return response indicating MFA is required
    return res.status(200).json({
      message: 'Password verified. Please enter the verification code sent to your email.',
      mfaRequired: true,
      userId: user.userId,
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'), // Mask email for security
      // In development, include the code for testing
      ...(process.env.NODE_ENV === 'development' && sendResult.code && { 
        devCode: sendResult.code 
      })
    });

  } catch (error) {
    console.error('Login error:', error);
    logAuthAttempt(req.body.identifier || 'unknown', false, ip, { reason: 'server_error', error: error.message });
    return res.status(500).json({ 
      error: 'Internal server error during login' 
    });
  }
}

/**
 * Logout a student user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function logoutStudentUser(req, res) {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check if header follows "Bearer <token>" format
    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ 
        error: 'Invalid authorization header format' 
      });
    }

    const token = parts[1];

    // Add token to blacklist
    blacklistToken(token);

    // Return success response
    return res.status(200).json({
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    return res.status(500).json({ 
      error: 'Internal server error during logout' 
    });
  }
}

/**
 * Verify MFA code and complete login
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function verifyMFACode(req, res) {
  const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.connection.remoteAddress || 
             req.socket.remoteAddress ||
             'unknown';

  try {
    const { userId, code } = req.body;

    // Validate input
    if (!userId || !code) {
      return res.status(400).json({ 
        error: 'Missing required fields: userId and code' 
      });
    }

    // Validate code format (6 digits)
    if (!/^\d{6}$/.test(code)) {
      return res.status(400).json({ 
        error: 'Invalid code format. Code must be 6 digits.' 
      });
    }

    // Get MFA code from database
    const mfaData = await getMFACode(userId);

    if (!mfaData) {
      return res.status(404).json({ 
        error: 'No MFA code found. Please login again.' 
      });
    }

    // Check if code is locked due to too many attempts
    if (mfaData.locked) {
      const lockDuration = 30 * 60 * 1000; // 30 minutes
      const timeRemaining = Math.ceil((mfaData.lockedAt + lockDuration - Date.now()) / 1000 / 60);
      
      return res.status(429).json({ 
        error: `Account locked due to too many failed attempts. Please try again in ${timeRemaining} minutes.` 
      });
    }

    // Verify the OTP code
    const verification = verifyOTP(code, mfaData.code, mfaData.expiresAt);

    if (!verification.valid) {
      // Increment attempt counter
      const attempts = await incrementMFAAttempts(userId);
      
      // Lock after 3 failed attempts
      if (attempts >= 3) {
        await lockMFACode(userId);
        logAuthAttempt(`userId:${userId}`, false, ip, { 
          reason: 'mfa_locked', 
          attempts 
        });
        
        return res.status(429).json({ 
          error: 'Too many failed attempts. Account locked for 30 minutes.' 
        });
      }

      logAuthAttempt(`userId:${userId}`, false, ip, { 
        reason: 'mfa_invalid', 
        attempts,
        verification: verification.reason
      });

      return res.status(401).json({ 
        error: verification.message,
        attemptsRemaining: 3 - attempts
      });
    }

    // Code is valid - get user info and generate tokens
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Generate JWT tokens
    const tokens = generateTokens({
      userId: user.userId,
      username: user.username,
      email: user.email
    });

    // Delete the used MFA code
    await deleteMFACode(userId);

    // Log successful authentication
    logAuthAttempt(user.username, true, ip, { 
      userId: user.userId,
      mfaVerified: true
    });

    // Return success response with tokens
    return res.status(200).json({
      message: 'Login successful',
      user: {
        userId: user.userId,
        username: user.username,
        fullName: user.fullName,
        email: user.email
      },
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken
    });

  } catch (error) {
    console.error('MFA verification error:', error);
    logAuthAttempt(`userId:${req.body.userId}`, false, ip, { 
      reason: 'mfa_error', 
      error: error.message 
    });
    return res.status(500).json({ 
      error: 'Internal server error during MFA verification' 
    });
  }
}

/**
 * Resend MFA code
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function resendMFACode(req, res) {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ 
        error: 'Missing required field: userId' 
      });
    }

    // Get user info
    const user = await getUserById(userId);
    
    if (!user) {
      return res.status(404).json({ 
        error: 'User not found' 
      });
    }

    // Check if there's an existing MFA code
    const existingMFA = await getMFACode(userId);
    
    if (existingMFA && existingMFA.locked) {
      return res.status(429).json({ 
        error: 'Account is locked. Please wait 30 minutes before requesting a new code.' 
      });
    }

    // Generate new OTP code
    const otpData = generateOTPWithExpiry();
    
    // Store new OTP in database
    await storeMFACode(userId, otpData.code, otpData.expiresAt);
    
    // Send OTP via email
    const sendResult = await sendOTPEmail(user.email, otpData.code, user.username);
    
    console.log(`MFA code resent to ${user.email}:`, sendResult.message);

    return res.status(200).json({
      message: 'Verification code resent successfully',
      email: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3'),
      // In development, include the code for testing
      ...(process.env.NODE_ENV === 'development' && sendResult.code && { 
        devCode: sendResult.code 
      })
    });

  } catch (error) {
    console.error('Resend MFA code error:', error);
    return res.status(500).json({ 
      error: 'Internal server error while resending code' 
    });
  }
}

/**
 * Get MFA status for logged-in user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getMFAStatus(req, res) {
  try {
    const userId = req.user.userId; // From JWT token

    const mfaEnabled = await getMFAPreference(userId);
    const user = await getUserById(userId);

    return res.status(200).json({
      mfaEnabled: mfaEnabled,
      email: user.email,
      emailMasked: user.email.replace(/(.{2})(.*)(@.*)/, '$1***$3')
    });

  } catch (error) {
    console.error('Get MFA status error:', error);
    return res.status(500).json({ 
      error: 'Internal server error while getting MFA status' 
    });
  }
}

/**
 * Enable MFA for logged-in user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function enableMFA(req, res) {
  try {
    const userId = req.user.userId; // From JWT token

    // Update MFA preference
    await updateMFAPreference(userId, true);

    // Get user info
    const user = await getUserById(userId);

    // Subscribe email to SNS if not already subscribed
    const snsResult = await subscribeEmailToSNS(user.email);
    console.log(`SNS subscription for ${user.email}:`, snsResult.message);

    return res.status(200).json({
      message: 'MFA enabled successfully',
      mfaEnabled: true,
      snsSubscription: snsResult.subscribed ? 
        'Please check your email to confirm SNS subscription' : 
        'SNS not configured - codes will be logged to console'
    });

  } catch (error) {
    console.error('Enable MFA error:', error);
    return res.status(500).json({ 
      error: 'Internal server error while enabling MFA' 
    });
  }
}

/**
 * Disable MFA for logged-in user
 * Requires password confirmation for security
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function disableMFA(req, res) {
  try {
    const userId = req.user.userId; // From JWT token
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ 
        error: 'Password confirmation required to disable MFA' 
      });
    }

    // Get user info
    const user = await getUserById(userId);

    // Verify password
    const passwordMatch = await comparePassword(password, user.password);

    if (!passwordMatch) {
      return res.status(401).json({ 
        error: 'Invalid password' 
      });
    }

    // Update MFA preference
    await updateMFAPreference(userId, false);

    return res.status(200).json({
      message: 'MFA disabled successfully',
      mfaEnabled: false,
      warning: 'Your account is now less secure. We recommend keeping MFA enabled.'
    });

  } catch (error) {
    console.error('Disable MFA error:', error);
    return res.status(500).json({ 
      error: 'Internal server error while disabling MFA' 
    });
  }
}

module.exports = {
  registerStudentUser,
  loginStudentUser,
  logoutStudentUser,
  verifyMFACode,
  resendMFACode,
  getMFAStatus,
  enableMFA,
  disableMFA
};
