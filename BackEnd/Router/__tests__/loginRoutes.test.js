const request = require('supertest');
const app = require('../../server');
const { clearBlacklist } = require('../../Middleware/auth');

jest.mock('../../database/userOperations');
jest.mock('../../database/dynamoClient', () => ({
  __esModule: true,
  default: {}
}));

const { userExistsInDB, getUserByIdentifier, pushUserData } = require('../../database/userOperations');

describe('Authentication Routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    clearBlacklist();
  });

  describe('POST /api/loginFunc/register', () => {
    it('should register a new user with valid data', async () => {
      userExistsInDB.mockResolvedValue(false);
      pushUserData.mockResolvedValue(1234567890);

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
      expect(response.body).toHaveProperty('accessToken');
    });

    it('should return 400 for missing required fields', async () => {
      const response = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'testuser',
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/loginFunc/login', () => {
    it('should login with valid credentials', async () => {
      const mockUser = {
        userId: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: '$2b$14$test'
      };

      getUserByIdentifier.mockResolvedValue(mockUser);
      
      const bcrypt = require('bcrypt');
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

      const response = await request(app)
        .post('/api/loginFunc/login')
        .send({
          identifier: 'testuser',
          password: 'SecurePass123!@#'
        })
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Login successful');
      expect(response.body).toHaveProperty('accessToken');
    });
  });

  describe('POST /api/loginFunc/logout', () => {
    it('should return 401 without token', async () => {
      const response = await request(app)
        .post('/api/loginFunc/logout')
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');
    });
  });
});
