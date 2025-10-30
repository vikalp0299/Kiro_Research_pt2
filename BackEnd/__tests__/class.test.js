const request = require('supertest');
const app = require('../server');
const jwt = require('jsonwebtoken');

// Mock the database functions
jest.mock('../../Database/dataExtraction');
jest.mock('../../Database/dataInsertion');

const { dispAvailableClass, dispEnrolledClass, dispDroppedClass, getAllClasses } = require('../../Database/dataExtraction');
const { pushRegistry, updateRegistry } = require('../../Database/dataInsertion');

describe('Class Management Endpoints', () => {
  let validToken;
  const mockUser = {
    userID: 1234567890,
    username: 'testuser',
    email: 'test@example.com'
  };

  beforeEach(() => {
    jest.clearAllMocks();
    // Generate a valid JWT token for testing
    validToken = jwt.sign(mockUser, process.env.JWT_SECRET || 'your-secret-key-change-in-production');
  });

  describe('GET /api/classFunc/available', () => {
    test('should get available classes successfully', async () => {
      const mockAvailableClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems',
          credits: 3,
          description: 'Advanced concepts in database design'
        }
      ];

      dispAvailableClass.mockResolvedValue(mockAvailableClasses);

      const response = await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockAvailableClasses);
    });

    test('should return error for missing token', async () => {
      const response = await request(app)
        .get('/api/classFunc/available');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NO_TOKEN');
    });

    test('should return error for invalid token', async () => {
      const response = await request(app)
        .get('/api/classFunc/available')
        .set('Authorization', 'Bearer invalid-token');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('INVALID_TOKEN');
    });
  });

  describe('GET /api/classFunc/enrolled', () => {
    test('should get enrolled classes successfully', async () => {
      const mockEnrolledClasses = [
        {
          classId: 'CSE 201',
          className: 'Data Structures and Algorithms',
          userID: 1234567890,
          registrationStatus: 'enrolled'
        }
      ];

      dispEnrolledClass.mockResolvedValue(mockEnrolledClasses);

      const response = await request(app)
        .get('/api/classFunc/enrolled')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockEnrolledClasses);
    });
  });

  describe('GET /api/classFunc/dropped', () => {
    test('should get dropped classes successfully', async () => {
      const mockDroppedClasses = [
        {
          classId: 'CCE 301',
          className: 'Computer Networks',
          userID: 1234567890,
          registrationStatus: 'dropped'
        }
      ];

      dispDroppedClass.mockResolvedValue(mockDroppedClasses);

      const response = await request(app)
        .get('/api/classFunc/dropped')
        .set('Authorization', `Bearer ${validToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDroppedClasses);
    });
  });

  describe('POST /api/classFunc/register', () => {
    test('should register for class successfully', async () => {
      const mockAllClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems',
          credits: 3,
          description: 'Advanced concepts in database design'
        }
      ];

      const mockRegistrationResult = {
        classId: 'IFT 593',
        userID: 1234567890,
        className: 'Advanced Database Systems',
        registrationStatus: 'enrolled'
      };

      getAllClasses.mockResolvedValue(mockAllClasses);
      dispEnrolledClass.mockResolvedValue([]);
      dispDroppedClass.mockResolvedValue([]);
      pushRegistry.mockResolvedValue(mockRegistrationResult);

      const response = await request(app)
        .post('/api/classFunc/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ classId: 'IFT 593' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockRegistrationResult);
    });

    test('should return error for missing class ID', async () => {
      const response = await request(app)
        .post('/api/classFunc/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_CLASS_ID');
    });

    test('should return error for non-existent class', async () => {
      getAllClasses.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/classFunc/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ classId: 'NONEXISTENT 999' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('CLASS_NOT_FOUND');
    });

    test('should return error for already enrolled class', async () => {
      const mockAllClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems'
        }
      ];

      const mockEnrolledClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems',
          registrationStatus: 'enrolled'
        }
      ];

      getAllClasses.mockResolvedValue(mockAllClasses);
      dispEnrolledClass.mockResolvedValue(mockEnrolledClasses);

      const response = await request(app)
        .post('/api/classFunc/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ classId: 'IFT 593' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('ALREADY_ENROLLED');
    });

    test('should re-enroll previously dropped class', async () => {
      const mockAllClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems'
        }
      ];

      const mockDroppedClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems',
          registrationStatus: 'dropped'
        }
      ];

      const mockUpdateResult = {
        classId: 'IFT 593',
        userID: 1234567890,
        className: 'Advanced Database Systems',
        registrationStatus: 'enrolled'
      };

      getAllClasses.mockResolvedValue(mockAllClasses);
      dispEnrolledClass.mockResolvedValue([]);
      dispDroppedClass.mockResolvedValue(mockDroppedClasses);
      updateRegistry.mockResolvedValue(mockUpdateResult);

      const response = await request(app)
        .post('/api/classFunc/register')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ classId: 'IFT 593' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(updateRegistry).toHaveBeenCalledWith('IFT 593', 1234567890, 'enrolled');
    });
  });

  describe('POST /api/classFunc/deregister', () => {
    test('should deregister from class successfully', async () => {
      const mockEnrolledClasses = [
        {
          classId: 'IFT 593',
          className: 'Advanced Database Systems',
          registrationStatus: 'enrolled'
        }
      ];

      const mockDeregistrationResult = {
        classId: 'IFT 593',
        userID: 1234567890,
        className: 'Advanced Database Systems',
        registrationStatus: 'dropped'
      };

      dispEnrolledClass.mockResolvedValue(mockEnrolledClasses);
      updateRegistry.mockResolvedValue(mockDeregistrationResult);

      const response = await request(app)
        .post('/api/classFunc/deregister')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ classId: 'IFT 593' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockDeregistrationResult);
    });

    test('should return error for missing class ID', async () => {
      const response = await request(app)
        .post('/api/classFunc/deregister')
        .set('Authorization', `Bearer ${validToken}`)
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('MISSING_CLASS_ID');
    });

    test('should return error for not enrolled class', async () => {
      dispEnrolledClass.mockResolvedValue([]);

      const response = await request(app)
        .post('/api/classFunc/deregister')
        .set('Authorization', `Bearer ${validToken}`)
        .send({ classId: 'IFT 593' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.code).toBe('NOT_ENROLLED');
    });
  });
});