/**
 * End-to-End API Workflow Tests
 * Tests complete user workflows from registration through class management
 */

const request = require('supertest');

// Mock rate limiters before importing server
jest.mock('../Middleware/rateLimiter', () => ({
  globalLimiter: (req, res, next) => next(),
  authLimiter: (req, res, next) => next()
}));

const app = require('../server');
const { clearBlacklist } = require('../Middleware/auth');

// Mock database operations
jest.mock('../database/userOperations');
jest.mock('../database/classOperations');
jest.mock('../database/registrationOperations');
jest.mock('../database/dynamoClient', () => ({
  __esModule: true,
  default: {}
}));

const { userExistsInDB, getUserByIdentifier, pushUserData } = require('../database/userOperations');
const { getAllClasses, getClassById } = require('../database/classOperations');
const { 
  dispAvailableClass, 
  dispEnrolledClass, 
  dispDroppedClass, 
  getRegistration, 
  pushRegistry, 
  updateRegistry 
} = require('../database/registrationOperations');

describe('End-to-End API Workflow Tests', () => {
  const bcrypt = require('bcrypt');
  
  beforeEach(() => {
    jest.clearAllMocks();
    clearBlacklist();
    // Reset bcrypt spy
    if (bcrypt.compare.mockRestore) {
      bcrypt.compare.mockRestore();
    }
    if (bcrypt.hash.mockRestore) {
      bcrypt.hash.mockRestore();
    }
  });
  
  // Helper function to get authenticated token
  async function getAuthToken(username = 'testuser') {
    const mockUser = {
      userId: 1234567890,
      username: username,
      fullName: 'Test User',
      email: 'test@example.com',
      password: '$2b$14$hashedPassword'
    };

    getUserByIdentifier.mockResolvedValue(mockUser);
    jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);

    const loginResponse = await request(app)
      .post('/api/loginFunc/login')
      .send({
        identifier: username,
        password: 'SecurePass123!@#'
      });

    if (loginResponse.status !== 200) {
      throw new Error(`Login failed with status ${loginResponse.status}: ${JSON.stringify(loginResponse.body)}`);
    }

    return loginResponse.body.accessToken;
  }

  describe('Complete User Registration and Login Flow', () => {
    test('should complete full registration and login workflow', async () => {
      // Step 1: Register new user
      userExistsInDB.mockResolvedValue(false);
      pushUserData.mockResolvedValue(1234567890);
      
      // Mock password hashing
      jest.spyOn(bcrypt, 'hash').mockResolvedValue('$2b$14$hashedPassword');

      const registrationResponse = await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'newuser',
          fullName: 'New User',
          email: 'newuser@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(201);

      expect(registrationResponse.body).toHaveProperty('accessToken');
      expect(registrationResponse.body).toHaveProperty('user');
      expect(registrationResponse.body.user.username).toBe('newuser');

      const registrationToken = registrationResponse.body.accessToken;

      // Step 2: Verify token works on protected route
      dispAvailableClass.mockResolvedValue([]);

      const protectedResponse = await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(200);

      expect(protectedResponse.body).toHaveProperty('classes');

      // Step 3: Logout
      await request(app)
        .post('/api/loginFunc/logout')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(200);

      // Step 4: Verify token is blacklisted
      await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${registrationToken}`)
        .expect(401);

      // Step 5: Login with same credentials
      const loginToken = await getAuthToken('newuser');
      
      expect(loginToken).toBeDefined();

      // Step 6: Verify new token works

      await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${loginToken}`)
        .expect(200);
    });

    test('should prevent duplicate registration', async () => {
      // Attempt to register with existing username
      userExistsInDB.mockResolvedValueOnce(true); // username exists

      await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'existinguser',
          fullName: 'Existing User',
          email: 'newemail@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(409);

      // Attempt to register with existing email
      userExistsInDB.mockResolvedValueOnce(false).mockResolvedValueOnce(true); // email exists

      await request(app)
        .post('/api/loginFunc/register')
        .send({
          username: 'newuser',
          fullName: 'New User',
          email: 'existing@example.com',
          password: 'SecurePass123!@#'
        })
        .expect(409);
    });
  });

  describe('Complete Class Enrollment Workflow', () => {
    test('should complete full class enrollment workflow', async () => {
      const authToken = await getAuthToken();
      
      const mockClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Networks',
          credits: 4,
          description: 'Advanced networking course'
        },
        {
          classId: 'CSE 201',
          className: 'Data Structures',
          credits: 3,
          description: 'Data structures course'
        }
      ];

      // Step 1: View available classes
      dispAvailableClass.mockResolvedValue(mockClasses);

      const availableResponse = await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(availableResponse.body.classes).toHaveLength(2);
      expect(availableResponse.body.classes[0].classId).toBe('IFT 593');

      // Step 2: Enroll in first class
      getClassById.mockResolvedValue(mockClasses[0]);
      getRegistration.mockResolvedValue(null);
      pushRegistry.mockResolvedValue();

      const enrollResponse = await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(201);

      expect(enrollResponse.body.message).toBe('Successfully enrolled in class');
      expect(enrollResponse.body.classId).toBe('IFT 593');

      // Step 3: View enrolled classes
      dispEnrolledClass.mockResolvedValue([
        {
          classId: 'IFT 593',
          userId: 1234567890,
          className: 'Advanced Networks',
          registrationState: 'enrolled'
        }
      ]);
      getClassById.mockResolvedValue(mockClasses[0]);

      const enrolledResponse = await request(app)
        .get('/api/classFunc/enrolled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(enrolledResponse.body.classes).toHaveLength(1);
      expect(enrolledResponse.body.classes[0].classId).toBe('IFT 593');

      // Step 4: Verify class no longer in available list
      dispAvailableClass.mockResolvedValue([mockClasses[1]]);

      const updatedAvailableResponse = await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(updatedAvailableResponse.body.classes).toHaveLength(1);
      expect(updatedAvailableResponse.body.classes[0].classId).toBe('CSE 201');
    });

    test('should prevent duplicate enrollment', async () => {
      const authToken = await getAuthToken();
      
      const mockClass = {
        classId: 'IFT 593',
        className: 'Advanced Networks',
        credits: 4,
        description: 'Advanced networking course'
      };

      // Try to enroll in already enrolled class
      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue({
        classId: 'IFT 593',
        userId: 1234567890,
        className: 'Advanced Networks',
        registrationState: 'enrolled'
      });

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(409);
    });
  });

  describe('Complete Class Unenrollment and Re-enrollment Workflow', () => {
    const mockClass = {
      classId: 'IFT 593',
      className: 'Advanced Networks',
      credits: 4,
      description: 'Advanced networking course'
    };

    test('should complete full unenrollment and re-enrollment workflow', async () => {
      const authToken = await getAuthToken();
      // Step 1: Verify enrolled in class
      dispEnrolledClass.mockResolvedValue([
        {
          classId: 'IFT 593',
          userId: 1234567890,
          className: 'Advanced Networks',
          registrationState: 'enrolled'
        }
      ]);
      getClassById.mockResolvedValue(mockClass);

      const enrolledResponse = await request(app)
        .get('/api/classFunc/enrolled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(enrolledResponse.body.classes).toHaveLength(1);

      // Step 2: Unenroll from class
      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue({
        classId: 'IFT 593',
        userId: 1234567890,
        className: 'Advanced Networks',
        registrationState: 'enrolled'
      });
      updateRegistry.mockResolvedValue();

      const unenrollResponse = await request(app)
        .post('/api/classFunc/unenroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(200);

      expect(unenrollResponse.body.message).toBe('Successfully unenrolled from class');

      // Step 3: Verify class appears in dropped list
      dispDroppedClass.mockResolvedValue([
        {
          classId: 'IFT 593',
          userId: 1234567890,
          className: 'Advanced Networks',
          registrationState: 'dropped'
        }
      ]);
      getClassById.mockResolvedValue(mockClass);

      const droppedResponse = await request(app)
        .get('/api/classFunc/dropped')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(droppedResponse.body.classes).toHaveLength(1);
      expect(droppedResponse.body.classes[0].classId).toBe('IFT 593');

      // Step 4: Re-enroll in dropped class
      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue({
        classId: 'IFT 593',
        userId: 1234567890,
        className: 'Advanced Networks',
        registrationState: 'dropped'
      });
      updateRegistry.mockResolvedValue();

      const reenrollResponse = await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(200);

      expect(reenrollResponse.body.message).toBe('Successfully re-enrolled in class');

      // Step 5: Verify class back in enrolled list
      dispEnrolledClass.mockResolvedValue([
        {
          classId: 'IFT 593',
          userId: 1234567890,
          className: 'Advanced Networks',
          registrationState: 'enrolled'
        }
      ]);
      getClassById.mockResolvedValue(mockClass);

      const finalEnrolledResponse = await request(app)
        .get('/api/classFunc/enrolled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(finalEnrolledResponse.body.classes).toHaveLength(1);
      expect(finalEnrolledResponse.body.classes[0].classId).toBe('IFT 593');
    });

    test('should prevent unenrollment from non-enrolled class', async () => {
      const authToken = await getAuthToken();
      
      // Try to unenroll from class not enrolled in
      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue(null);

      await request(app)
        .post('/api/classFunc/unenroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(404);
    });

    test('should prevent unenrollment from already dropped class', async () => {
      const authToken = await getAuthToken();
      
      // Try to unenroll from already dropped class
      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue({
        classId: 'IFT 593',
        userId: 1234567890,
        className: 'Advanced Networks',
        registrationState: 'dropped'
      });

      await request(app)
        .post('/api/classFunc/unenroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(400);
    });
  });

  describe('Multi-Class Enrollment Workflow', () => {
    const mockClasses = [
      {
        classId: 'IFT 593',
        className: 'Advanced Networks',
        credits: 4,
        description: 'Advanced networking course'
      },
      {
        classId: 'CSE 201',
        className: 'Data Structures',
        credits: 3,
        description: 'Data structures course'
      },
      {
        classId: 'CCE 301',
        className: 'Computer Architecture',
        credits: 4,
        description: 'Computer architecture course'
      }
    ];

    test('should enroll in multiple classes sequentially', async () => {
      const authToken = await getAuthToken();
      // Enroll in first class
      getClassById.mockResolvedValue(mockClasses[0]);
      getRegistration.mockResolvedValue(null);
      pushRegistry.mockResolvedValue();

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(201);

      // Enroll in second class
      getClassById.mockResolvedValue(mockClasses[1]);
      getRegistration.mockResolvedValue(null);
      pushRegistry.mockResolvedValue();

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'CSE 201' })
        .expect(201);

      // Enroll in third class
      getClassById.mockResolvedValue(mockClasses[2]);
      getRegistration.mockResolvedValue(null);
      pushRegistry.mockResolvedValue();

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'CCE 301' })
        .expect(201);

      // Verify all three classes are enrolled
      dispEnrolledClass.mockResolvedValue([
        {
          classId: 'IFT 593',
          userId: 1234567890,
          className: 'Advanced Networks',
          registrationState: 'enrolled'
        },
        {
          classId: 'CSE 201',
          userId: 1234567890,
          className: 'Data Structures',
          registrationState: 'enrolled'
        },
        {
          classId: 'CCE 301',
          userId: 1234567890,
          className: 'Computer Architecture',
          registrationState: 'enrolled'
        }
      ]);

      getClassById
        .mockResolvedValueOnce(mockClasses[0])
        .mockResolvedValueOnce(mockClasses[1])
        .mockResolvedValueOnce(mockClasses[2]);

      const enrolledResponse = await request(app)
        .get('/api/classFunc/enrolled')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(enrolledResponse.body.classes).toHaveLength(3);
    });
  });

  describe('Authentication Error Scenarios', () => {
    test('should handle expired token gracefully', async () => {
      // Use an expired token (this would be expired in real scenario)
      const expiredToken = 'expired.jwt.token';

      await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${expiredToken}`)
        .expect(401);
    });

    test('should handle missing token', async () => {
      await request(app)
        .get('/api/classFunc/available')
        .expect(401);
    });

    test('should handle malformed token', async () => {
      await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', 'Bearer malformed-token')
        .expect(401);
    });

    test('should handle invalid authorization header format', async () => {
      await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', 'InvalidFormat token123')
        .expect(401);
    });
  });

  describe('Class Operation Error Scenarios', () => {
    test('should handle enrollment in non-existent class', async () => {
      const authToken = await getAuthToken();
      getClassById.mockResolvedValue(null);

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'FAKE 999' })
        .expect(404);
    });

    test('should handle invalid classId format', async () => {
      const authToken = await getAuthToken();
      
      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: '' })
        .expect(400);

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 123 })
        .expect(400);
    });

    test('should handle database errors gracefully', async () => {
      const authToken = await getAuthToken();
      
      getClassById.mockRejectedValue(new Error('Database connection failed'));

      await request(app)
        .post('/api/classFunc/enroll')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ classId: 'IFT 593' })
        .expect(500);
    });
  });
});
