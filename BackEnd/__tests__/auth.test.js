const request = require('supertest');
const app = require('../server');

// Mock the database functions
jest.mock('../../Database/dataExtraction');
jest.mock('../../Database/dataInsertion');

const { userExistsInDB } = require('../../Database/dataExtraction');
const { pushUserData } = require('../../Database/dataInsertion');

describe('Authentication Endpoints', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/loginFunc/register', () => {
    const validUserData = {
      username: 'testuser',
      fullName: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!'
    };

    test('should register a new user successfully', async () => {
      userExistsInDB.mockResolvedValue(null);
      pushUserData.mockResolvedValue({
        userID: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send(validUserData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.token).toBeDefined();
    });

    test('should return error for missing fields', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          email: 'test@example.com'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_FIELDS');
    });

    // Password confirmation is handled on the frontend, not backend

    test('should return error for invalid email format', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          ...validUserData,
          email: 'invalid-email'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_EMAIL');
    });

    test('should return error for weak password', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          ...validUserData,
          password: 'weak'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('WEAK_PASSWORD');
    });

    test('should return error for existing user', async () => {
      userExistsInDB.mockResolvedValue({
        userID: 1234567890,
        username: 'testuser',
        email: 'test@example.com'
      });

      const response = await request(app)
        .post('/api/loginFunc/register')
        .send(validUserData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('USER_EXISTS');
    });
  });

  describe('POST /api/loginFunc/login', () => {
    test('should login user successfully', async () => {
      userExistsInDB.mockResolvedValue({
        userID: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: '$2b$12$hashedpassword'
      });

      // Mock bcrypt compare to return true
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          usernameOrEmail: 'testuser',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.username).toBe('testuser');
      expect(response.body.token).toBeDefined();
    });

    test('should return error for missing credentials', async () => {
      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          usernameOrEmail: 'testuser'
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_CREDENTIALS');
    });

    test('should return error for non-existent user', async () => {
      userExistsInDB.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          usernameOrEmail: 'nonexistent',
          password: 'TestPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });

    test('should return error for invalid password', async () => {
      userExistsInDB.mockResolvedValue({
        userID: 1234567890,
        username: 'testuser',
        password: '$2b$12$hashedpassword'
      });

      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          usernameOrEmail: 'testuser',
          password: 'WrongPassword123!'
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_CREDENTIALS');
    });
  });

  describe('POST /api/loginFunc/logout', () => {
    test('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', 'Bearer valid-jwt-token');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Logged out successfully');
    });

    test('should return error for missing token', async () => {
      const response = await request(app)
        .post('/api/loginFunc/logout');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_TOKEN');
    });
  });
});