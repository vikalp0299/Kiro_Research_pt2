const request = require('supertest');
const express = require('express');
const { registerStudentUser, loginStudentUser, logoutStudentUser } = require('../loginController');
const { userExistsInDB, pushUserData, getUserByIdentifier } = require('../../database/userOperations');
const { hashPassword, validatePasswordStrength, comparePassword } = require('../../Middleware/password');
const { generateTokens, blacklistToken, isTokenBlacklisted, verifyToken } = require('../../Middleware/auth');
const { logAuthAttempt } = require('../../Middleware/logger');

// Mock dependencies
jest.mock('../../database/userOperations');
jest.mock('../../Middleware/password');
jest.mock('../../Middleware/auth');
jest.mock('../../Middleware/logger');

// Set up test environment variables
process.env.JWT_SECRET = 'test-secret-key-for-testing-purposes-only-256-bits';
process.env.JWT_ISSUER = 'class-registration-app';
process.env.JWT_AUDIENCE = 'class-registration-users';
process.env.BCRYPT_SALT_ROUNDS = '14';

// Create Express app for testing
const app = express();
app.use(express.json());
app.post('/api/loginFunc/register', registerStudentUser);
app.post('/api/loginFunc/login', loginStudentUser);
app.post('/api/loginFunc/logout', logoutStudentUser);
// Protected route for testing blacklisted tokens
app.get('/api/protected', verifyToken, (req, res) => {
  res.status(200).json({ message: 'Access granted', user: req.user });
});

describe('User Registration Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/loginFunc/register - Successful Registration', () => {
    test('should register user with valid data and return JWT token', async () => {
      // Mock successful validation and operations
      validatePasswordStrength.mockReturnValue({
        isValid: true,
        strength: 'strong',
        errors: []
      });
      userExistsInDB.mockResolvedValueOnce(false).mockResolvedValueOnce(false); // username and email don't exist
      hashPassword.mockResolvedValue('$2b$14$hashedPasswordString');
      pushUserData.mockResolvedValue(1234567890);
      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'User registered successfully');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId', 1234567890);
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('fullName', 'Test User');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('accessToken', 'mock-access-token');
      expect(response.body).toHaveProperty('refreshToken', 'mock-refresh-token');

      // Verify password was hashed
      expect(hashPassword).toHaveBeenCalledWith('SecurePass123!@#');
      
      // Verify user data was stored
      expect(pushUserData).toHaveBeenCalledWith({
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: '$2b$14$hashedPasswordString'
      });

      // Verify tokens were generated
      expect(generateTokens).toHaveBeenCalledWith({
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      });
    });
  });

  describe('POST /api/loginFunc/register - Weak Password', () => {
    test('should reject registration with weak password', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: false,
        strength: 'weak',
        errors: [
          'Password must be at least 12 characters long',
          'Password must contain at least one uppercase letter',
          'Password must contain at least one special character'
        ]
      });

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'weak123'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Password does not meet security requirements');
      expect(response.body).toHaveProperty('details');
      expect(response.body.details).toBeInstanceOf(Array);
      expect(response.body.details.length).toBeGreaterThan(0);

      // Verify no database operations were performed
      expect(userExistsInDB).not.toHaveBeenCalled();
      expect(pushUserData).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    test('should reject password without uppercase letter', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: false,
        strength: 'weak',
        errors: ['Password must contain at least one uppercase letter']
      });

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'weakpassword123!'
        })
        .expect(400);

      expect(response.body.error).toBe('Password does not meet security requirements');
    });

    test('should reject password without special character', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: false,
        strength: 'weak',
        errors: ['Password must contain at least one special character']
      });

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'WeakPassword123'
        })
        .expect(400);

      expect(response.body.error).toBe('Password does not meet security requirements');
    });
  });

  describe('POST /api/loginFunc/register - Existing Username', () => {
    test('should reject registration with existing username', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: true,
        strength: 'strong',
        errors: []
      });
      userExistsInDB.mockResolvedValueOnce(true); // username exists

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'existinguser',
          fullName: 'Test User',
          email: 'newemail@example.com',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Username already exists');

      // Verify username was checked
      expect(userExistsInDB).toHaveBeenCalledWith('existinguser');
      
      // Verify no user was created
      expect(pushUserData).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/loginFunc/register - Existing Email', () => {
    test('should reject registration with existing email', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: true,
        strength: 'strong',
        errors: []
      });
      userExistsInDB.mockResolvedValueOnce(false).mockResolvedValueOnce(true); // username doesn't exist, email exists

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'newuser',
          fullName: 'Test User',
          email: 'existing@example.com',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Email already exists');

      // Verify both username and email were checked
      expect(userExistsInDB).toHaveBeenCalledWith('newuser');
      expect(userExistsInDB).toHaveBeenCalledWith('existing@example.com');
      
      // Verify no user was created
      expect(pushUserData).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/loginFunc/register - Invalid Email Format', () => {
    test('should reject registration with invalid email format', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'invalid-email',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid email format');

      // Verify no database operations were performed
      expect(userExistsInDB).not.toHaveBeenCalled();
      expect(pushUserData).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    test('should reject email without @ symbol', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'invalidemail.com',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });

    test('should reject email without domain', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Invalid email format');
    });
  });

  describe('POST /api/loginFunc/register - Missing Fields', () => {
    test('should reject registration with missing username', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: username, fullName, email, password');
    });

    test('should reject registration with missing fullName', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: username, fullName, email, password');
    });

    test('should reject registration with missing email', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: username, fullName, email, password');
    });

    test('should reject registration with missing password', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body.error).toBe('Missing required fields: username, fullName, email, password');
    });
  });

  describe('POST /api/loginFunc/register - Invalid Username Format', () => {
    test('should reject username with special characters', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'test@user',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Username must be 3-20 alphanumeric characters');
    });

    test('should reject username that is too short', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'ab',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Username must be 3-20 alphanumeric characters');
    });

    test('should reject username that is too long', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'thisusernameiswaytoolongforvalidation',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(400);

      expect(response.body.error).toBe('Username must be 3-20 alphanumeric characters');
    });
  });

  describe('POST /api/loginFunc/register - Server Errors', () => {
    test('should handle database errors gracefully', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: true,
        strength: 'strong',
        errors: []
      });
      userExistsInDB.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error during registration');
    });

    test('should handle password hashing errors', async () => {
      validatePasswordStrength.mockReturnValue({
        isValid: true,
        strength: 'strong',
        errors: []
      });
      userExistsInDB.mockResolvedValueOnce(false).mockResolvedValueOnce(false);
      hashPassword.mockRejectedValue(new Error('Hashing failed'));

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          fullName: 'Test User',
          email: 'test@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(500);

      expect(response.body.error).toBe('Internal server error during registration');
    });
  });
});

describe('User Login Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/loginFunc/login - Successful Login', () => {
    test('should login user with valid username and password', async () => {
      const mockUser = {
        userId: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: '$2b$14$hashedPasswordString'
      };

      getUserByIdentifier.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token'
      });

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'testuser',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId', 1234567890);
      expect(response.body.user).toHaveProperty('username', 'testuser');
      expect(response.body.user).toHaveProperty('fullName', 'Test User');
      expect(response.body.user).toHaveProperty('email', 'test@example.com');
      expect(response.body).toHaveProperty('accessToken', 'mock-access-token');
      expect(response.body).toHaveProperty('refreshToken', 'mock-refresh-token');

      // Verify user was retrieved
      expect(getUserByIdentifier).toHaveBeenCalledWith('testuser');

      // Verify password was compared
      expect(comparePassword).toHaveBeenCalledWith('SecurePass123!@#', '$2b$14$hashedPasswordString');

      // Verify tokens were generated
      expect(generateTokens).toHaveBeenCalledWith({
        userId: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      });

      // Verify successful authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'testuser',
        true,
        expect.any(String),
        { userId: 1234567890 }
      );
    });

    test('should login user with valid email and password', async () => {
      const mockUser = {
        userId: 9876543210,
        username: 'emailuser',
        fullName: 'Email User',
        email: 'emailuser@example.com',
        password: '$2b$14$hashedPasswordString'
      };

      getUserByIdentifier.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(true);
      generateTokens.mockReturnValue({
        accessToken: 'mock-access-token-email',
        refreshToken: 'mock-refresh-token-email'
      });

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'emailuser@example.com',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body.user).toHaveProperty('userId', 9876543210);
      expect(response.body.user).toHaveProperty('email', 'emailuser@example.com');
      expect(response.body).toHaveProperty('accessToken', 'mock-access-token-email');

      // Verify user was retrieved by email
      expect(getUserByIdentifier).toHaveBeenCalledWith('emailuser@example.com');

      // Verify successful authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'emailuser@example.com',
        true,
        expect.any(String),
        { userId: 9876543210 }
      );
    });
  });

  describe('POST /api/loginFunc/login - Incorrect Password', () => {
    test('should return generic error message for incorrect password', async () => {
      const mockUser = {
        userId: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: '$2b$14$hashedPasswordString'
      };

      getUserByIdentifier.mockResolvedValue(mockUser);
      comparePassword.mockResolvedValue(false);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'testuser',
          password: 'WrongPassword123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');

      // Verify user was retrieved
      expect(getUserByIdentifier).toHaveBeenCalledWith('testuser');

      // Verify password was compared
      expect(comparePassword).toHaveBeenCalledWith('WrongPassword123!@#', '$2b$14$hashedPasswordString');

      // Verify tokens were NOT generated
      expect(generateTokens).not.toHaveBeenCalled();

      // Verify failed authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'testuser',
        false,
        expect.any(String),
        { reason: 'invalid_password', userId: 1234567890 }
      );
    });
  });

  describe('POST /api/loginFunc/login - Non-existent Username', () => {
    test('should return generic error message for non-existent username', async () => {
      getUserByIdentifier.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'nonexistentuser',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');

      // Verify user lookup was attempted
      expect(getUserByIdentifier).toHaveBeenCalledWith('nonexistentuser');

      // Verify password was NOT compared
      expect(comparePassword).not.toHaveBeenCalled();

      // Verify tokens were NOT generated
      expect(generateTokens).not.toHaveBeenCalled();

      // Verify failed authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'nonexistentuser',
        false,
        expect.any(String),
        { reason: 'user_not_found' }
      );
    });

    test('should return generic error message for non-existent email', async () => {
      getUserByIdentifier.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'nonexistent@example.com',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid credentials');

      // Verify failed authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'nonexistent@example.com',
        false,
        expect.any(String),
        { reason: 'user_not_found' }
      );
    });
  });

  describe('POST /api/loginFunc/login - Missing Fields', () => {
    test('should reject login with missing identifier', async () => {
      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields: identifier and password');

      // Verify no database operations were performed
      expect(getUserByIdentifier).not.toHaveBeenCalled();
      expect(comparePassword).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    test('should reject login with missing password', async () => {
      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'testuser'
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields: identifier and password');

      // Verify no database operations were performed
      expect(getUserByIdentifier).not.toHaveBeenCalled();
      expect(comparePassword).not.toHaveBeenCalled();
      expect(generateTokens).not.toHaveBeenCalled();
    });

    test('should reject login with both fields missing', async () => {
      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Missing required fields: identifier and password');
    });
  });

  describe('POST /api/loginFunc/login - Server Errors', () => {
    test('should handle database errors gracefully', async () => {
      getUserByIdentifier.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'testuser',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error during login');

      // Verify failed authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'testuser',
        false,
        expect.any(String),
        { reason: 'server_error', error: 'Database connection failed' }
      );
    });

    test('should handle password comparison errors', async () => {
      const mockUser = {
        userId: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: '$2b$14$hashedPasswordString'
      };

      getUserByIdentifier.mockResolvedValue(mockUser);
      comparePassword.mockRejectedValue(new Error('Password comparison failed'));

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'testuser',
          password: 'SecurePass123!@#'
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error during login');

      // Verify failed authentication was logged
      expect(logAuthAttempt).toHaveBeenCalledWith(
        'testuser',
        false,
        expect.any(String),
        { reason: 'server_error', error: 'Password comparison failed' }
      );
    });
  });
});

describe('User Logout Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/loginFunc/logout - Successful Logout', () => {
    test('should logout user with valid token', async () => {
      const mockToken = 'valid-jwt-token';
      
      blacklistToken.mockImplementation(() => {});

      const response = await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Logout successful');

      // Verify token was blacklisted
      expect(blacklistToken).toHaveBeenCalledWith(mockToken);
    });
  });

  describe('POST /api/loginFunc/logout - Without Token', () => {
    test('should return error when no authorization header is provided', async () => {
      const response = await request(app)
        .post('/api/loginFunc/logout')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');

      // Verify token was NOT blacklisted
      expect(blacklistToken).not.toHaveBeenCalled();
    });

    test('should return error when authorization header format is invalid', async () => {
      const response = await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', 'InvalidFormat token123')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid authorization header format');

      // Verify token was NOT blacklisted
      expect(blacklistToken).not.toHaveBeenCalled();
    });

    test('should return error when Bearer keyword is missing', async () => {
      const response = await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', 'token123')
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Invalid authorization header format');

      // Verify token was NOT blacklisted
      expect(blacklistToken).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/loginFunc/logout - Token Blacklisting', () => {
    test('should verify token is blacklisted after logout', async () => {
      const mockToken = 'token-to-blacklist';
      
      // Mock blacklistToken to actually add to a set
      const blacklistedTokens = new Set();
      blacklistToken.mockImplementation((token) => {
        blacklistedTokens.add(token);
      });
      isTokenBlacklisted.mockImplementation((token) => {
        return blacklistedTokens.has(token);
      });

      // Logout with the token
      await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect(200);

      // Verify token was blacklisted
      expect(blacklistToken).toHaveBeenCalledWith(mockToken);
      expect(isTokenBlacklisted(mockToken)).toBe(true);
    });
  });

  describe('GET /api/protected - Blacklisted Token Cannot Access Protected Routes', () => {
    test('should deny access to protected route with blacklisted token', async () => {
      const mockToken = 'blacklisted-token';
      
      // Mock verifyToken to check blacklist
      verifyToken.mockImplementation((req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        const parts = authHeader.split(' ');
        const token = parts[1];
        
        // Check if token is blacklisted
        if (isTokenBlacklisted(token)) {
          return res.status(401).json({ error: 'Token has been revoked' });
        }
        
        // Token is valid
        req.user = { userId: 123, username: 'testuser', email: 'test@example.com' };
        next();
      });

      // Mock isTokenBlacklisted to return true for this token
      isTokenBlacklisted.mockReturnValue(true);

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Token has been revoked');

      // Verify blacklist check was performed
      expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken);
    });

    test('should allow access to protected route with valid non-blacklisted token', async () => {
      const mockToken = 'valid-non-blacklisted-token';
      
      // Mock verifyToken to allow access
      verifyToken.mockImplementation((req, res, next) => {
        const authHeader = req.headers.authorization;
        if (!authHeader) {
          return res.status(401).json({ error: 'Authentication required' });
        }
        
        const parts = authHeader.split(' ');
        const token = parts[1];
        
        // Check if token is blacklisted
        if (isTokenBlacklisted(token)) {
          return res.status(401).json({ error: 'Token has been revoked' });
        }
        
        // Token is valid
        req.user = { userId: 123, username: 'testuser', email: 'test@example.com' };
        next();
      });

      // Mock isTokenBlacklisted to return false for this token
      isTokenBlacklisted.mockReturnValue(false);

      const response = await request(app)
        .get('/api/protected')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Access granted');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toHaveProperty('userId', 123);

      // Verify blacklist check was performed
      expect(isTokenBlacklisted).toHaveBeenCalledWith(mockToken);
    });
  });

  describe('POST /api/loginFunc/logout - Server Errors', () => {
    test('should handle blacklist errors gracefully', async () => {
      const mockToken = 'error-token';
      
      blacklistToken.mockImplementation(() => {
        throw new Error('Blacklist operation failed');
      });

      const response = await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', `Bearer ${mockToken}`)
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error during logout');
    });
  });
});
