const { userExistsInDB } = require('../../Database/dataExtraction');
const { pushUserData } = require('../../Database/dataInsertion');
const { hashPassword, comparePassword, validatePasswordStrength, validateEmail } = require('../Middleware/password');
const { generateToken, blacklistToken } = require('../Middleware/auth');

/**
 * Register a new student user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const registerStudentUser = async (req, res) => {
  try {
    const { username, fullName, email, password } = req.body;

    // Validate required fields
    if (!username || !fullName || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required',
        code: 'MISSING_FIELDS'
      });
    }

    // Validate email format
    if (!validateEmail(email)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid email format',
        code: 'INVALID_EMAIL'
      });
    }

    // Validate password strength
    const passwordValidation = validatePasswordStrength(password);
    if (!passwordValidation.isValid) {
      return res.status(400).json({
        success: false,
        message: passwordValidation.message,
        code: 'WEAK_PASSWORD'
      });
    }

    // Check if user already exists
    const existingUser = await userExistsInDB(username, email);
    if (existingUser) {
      return res.status(401).json({
        success: false,
        message: 'Username or email already exists',
        code: 'USER_EXISTS'
      });
    }

    // Create new user
    const newUser = await pushUserData({
      username,
      fullName,
      email,
      password
    });

    // Generate JWT token
    const token = generateToken({
      userID: newUser.userID,
      username: newUser.username,
      email: newUser.email
    });

    res.status(200).json({
      success: true,
      data: {
        userID: newUser.userID,
        username: newUser.username,
        fullName: newUser.fullName,
        email: newUser.email
      },
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration',
      code: 'REGISTRATION_ERROR'
    });
  }
};

/**
 * Login student user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const loginStudentUser = async (req, res) => {
  try {
    const { usernameOrEmail, password } = req.body;

    // Validate required fields
    if (!usernameOrEmail || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username/email and password are required',
        code: 'MISSING_CREDENTIALS'
      });
    }

    // Check if user exists (function checks both username and email)
    const user = await userExistsInDB(usernameOrEmail, usernameOrEmail);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
        code: 'INVALID_CREDENTIALS'
      });
    }

    // Generate JWT token
    const token = generateToken({
      userID: user.userID,
      username: user.username,
      email: user.email
    });

    res.status(200).json({
      success: true,
      data: {
        userID: user.userID,
        username: user.username,
        fullName: user.fullName,
        email: user.email
      },
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login',
      code: 'LOGIN_ERROR'
    });
  }
};

/**
 * Logout student user
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const logoutStudentUser = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'No token provided for logout',
        code: 'NO_TOKEN'
      });
    }

    // Add token to blacklist
    blacklistToken(token);

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during logout',
      code: 'LOGOUT_ERROR'
    });
  }
};

module.exports = {
  registerStudentUser,
  loginStudentUser,
  logoutStudentUser
};