const request = require('supertest');
const express = require('express');
const { displayAllAvailableClasses, getEnrolledClasses, getDroppedClasses, registerClass, deregisterClass } = require('../classController');
const { dispAvailableClass, dispEnrolledClass, dispDroppedClass, getRegistration, pushRegistry, updateRegistry } = require('../../database/registrationOperations');
const { getClassById } = require('../../database/classOperations');

// Mock dependencies
jest.mock('../../database/registrationOperations');
jest.mock('../../database/classOperations');

// Create Express app for testing
const app = express();
app.use(express.json());

// Mock authentication middleware
const mockAuthMiddleware = (req, res, next) => {
  // Simulate authenticated user
  req.user = {
    userId: 1234567890,
    username: 'testuser',
    email: 'test@example.com'
  };
  next();
};

// Apply mock auth middleware to protected routes
app.post('/api/classFunc/enroll', mockAuthMiddleware, registerClass);
app.post('/api/classFunc/unenroll', mockAuthMiddleware, deregisterClass);
app.get('/api/classFunc/available', mockAuthMiddleware, displayAllAvailableClasses);
app.get('/api/classFunc/enrolled', mockAuthMiddleware, getEnrolledClasses);
app.get('/api/classFunc/dropped', mockAuthMiddleware, getDroppedClasses);

describe('Class Enrollment Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/classFunc/enroll - Successful Enrollment', () => {
    test('should successfully enroll in an available class', async () => {
      const mockClass = {
        classId: 'IFT 593',
        className: 'Advanced Computer Networks',
        credits: 4,
        description: 'This course covers advanced topics in networking'
      };

      // Mock class exists
      getClassById.mockResolvedValue(mockClass);
      
      // Mock no existing registration
      getRegistration.mockResolvedValue(null);
      
      // Mock successful registration creation
      pushRegistry.mockResolvedValue();

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'IFT 593'
        })
        .expect('Content-Type', /json/)
        .expect(201);

      expect(response.body).toHaveProperty('message', 'Successfully enrolled in class');
      expect(response.body).toHaveProperty('classId', 'IFT 593');
      expect(response.body).toHaveProperty('className', 'Advanced Computer Networks');

      // Verify class existence was checked
      expect(getClassById).toHaveBeenCalledWith('IFT 593');

      // Verify registration was checked
      expect(getRegistration).toHaveBeenCalledWith('IFT 593', 1234567890);

      // Verify registration was created
      expect(pushRegistry).toHaveBeenCalledWith({
        classId: 'IFT 593',
        userId: 1234567890,
        className: 'Advanced Computer Networks',
        registrationState: 'enrolled'
      });
    });
  });

  describe('POST /api/classFunc/enroll - Re-enrollment in Previously Dropped Class', () => {
    test('should successfully re-enroll in a previously dropped class', async () => {
      const mockClass = {
        classId: 'CSE 201',
        className: 'Data Structures',
        credits: 3,
        description: 'Introduction to data structures and algorithms'
      };

      const mockExistingRegistration = {
        classId: 'CSE 201',
        userId: 1234567890,
        className: 'Data Structures',
        registrationState: 'dropped'
      };

      // Mock class exists
      getClassById.mockResolvedValue(mockClass);
      
      // Mock existing dropped registration
      getRegistration.mockResolvedValue(mockExistingRegistration);
      
      // Mock successful registration update
      updateRegistry.mockResolvedValue();

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'CSE 201'
        })
        .expect('Content-Type', /json/)
        .expect(200);

      expect(response.body).toHaveProperty('message', 'Successfully re-enrolled in class');
      expect(response.body).toHaveProperty('classId', 'CSE 201');
      expect(response.body).toHaveProperty('className', 'Data Structures');

      // Verify class existence was checked
      expect(getClassById).toHaveBeenCalledWith('CSE 201');

      // Verify registration was checked
      expect(getRegistration).toHaveBeenCalledWith('CSE 201', 1234567890);

      // Verify registration was updated to enrolled
      expect(updateRegistry).toHaveBeenCalledWith('CSE 201', 1234567890, 'enrolled');

      // Verify pushRegistry was NOT called (we're updating, not creating)
      expect(pushRegistry).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classFunc/enroll - Already Enrolled', () => {
    test('should fail when trying to enroll in an already enrolled class', async () => {
      const mockClass = {
        classId: 'IFT 593',
        className: 'Advanced Computer Networks',
        credits: 4,
        description: 'This course covers advanced topics in networking'
      };

      const mockExistingRegistration = {
        classId: 'IFT 593',
        userId: 1234567890,
        className: 'Advanced Computer Networks',
        registrationState: 'enrolled'
      };

      // Mock class exists
      getClassById.mockResolvedValue(mockClass);
      
      // Mock existing enrolled registration
      getRegistration.mockResolvedValue(mockExistingRegistration);

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'IFT 593'
        })
        .expect('Content-Type', /json/)
        .expect(409);

      expect(response.body).toHaveProperty('error', 'Already enrolled in this class');

      // Verify class existence was checked
      expect(getClassById).toHaveBeenCalledWith('IFT 593');

      // Verify registration was checked
      expect(getRegistration).toHaveBeenCalledWith('IFT 593', 1234567890);

      // Verify no registration operations were performed
      expect(pushRegistry).not.toHaveBeenCalled();
      expect(updateRegistry).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classFunc/enroll - Non-existent Class', () => {
    test('should fail when trying to enroll in a non-existent class', async () => {
      // Mock class does not exist
      getClassById.mockResolvedValue(null);

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'FAKE 999'
        })
        .expect('Content-Type', /json/)
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Class not found');

      // Verify class existence was checked
      expect(getClassById).toHaveBeenCalledWith('FAKE 999');

      // Verify no registration operations were performed
      expect(getRegistration).not.toHaveBeenCalled();
      expect(pushRegistry).not.toHaveBeenCalled();
      expect(updateRegistry).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classFunc/enroll - Without Authentication', () => {
    test('should fail when no authentication token is provided', async () => {
      // Create a route without auth middleware
      const appNoAuth = express();
      appNoAuth.use(express.json());
      appNoAuth.post('/api/classFunc/enroll', registerClass);

      const response = await request(appNoAuth)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'IFT 593'
        })
        .expect('Content-Type', /json/)
        .expect(401);

      expect(response.body).toHaveProperty('error', 'Authentication required');

      // Verify no database operations were performed
      expect(getClassById).not.toHaveBeenCalled();
      expect(getRegistration).not.toHaveBeenCalled();
      expect(pushRegistry).not.toHaveBeenCalled();
      expect(updateRegistry).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classFunc/enroll - Invalid Input', () => {
    test('should fail when classId is missing', async () => {
      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({})
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid classId: must be a non-empty string');

      // Verify no database operations were performed
      expect(getClassById).not.toHaveBeenCalled();
      expect(getRegistration).not.toHaveBeenCalled();
      expect(pushRegistry).not.toHaveBeenCalled();
      expect(updateRegistry).not.toHaveBeenCalled();
    });

    test('should fail when classId is not a string', async () => {
      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 12345
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid classId: must be a non-empty string');

      // Verify no database operations were performed
      expect(getClassById).not.toHaveBeenCalled();
    });

    test('should fail when classId is an empty string', async () => {
      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: ''
        })
        .expect('Content-Type', /json/)
        .expect(400);

      expect(response.body).toHaveProperty('error', 'Invalid classId: must be a non-empty string');

      // Verify no database operations were performed
      expect(getClassById).not.toHaveBeenCalled();
    });
  });

  describe('POST /api/classFunc/enroll - Server Errors', () => {
    test('should handle database errors gracefully', async () => {
      // Mock database error
      getClassById.mockRejectedValue(new Error('Database connection failed'));

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'IFT 593'
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error while enrolling in class');

      // Verify class lookup was attempted
      expect(getClassById).toHaveBeenCalledWith('IFT 593');
    });

    test('should handle registration creation errors', async () => {
      const mockClass = {
        classId: 'IFT 593',
        className: 'Advanced Computer Networks',
        credits: 4,
        description: 'This course covers advanced topics in networking'
      };

      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue(null);
      pushRegistry.mockRejectedValue(new Error('Failed to create registration'));

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'IFT 593'
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error while enrolling in class');
    });

    test('should handle registration update errors', async () => {
      const mockClass = {
        classId: 'CSE 201',
        className: 'Data Structures',
        credits: 3,
        description: 'Introduction to data structures'
      };

      const mockExistingRegistration = {
        classId: 'CSE 201',
        userId: 1234567890,
        className: 'Data Structures',
        registrationState: 'dropped'
      };

      getClassById.mockResolvedValue(mockClass);
      getRegistration.mockResolvedValue(mockExistingRegistration);
      updateRegistry.mockRejectedValue(new Error('Failed to update registration'));

      const response = await request(app)
        .post('/api/classFunc/enroll')
        .send({
          classId: 'CSE 201'
        })
        .expect('Content-Type', /json/)
        .expect(500);

      expect(response.body).toHaveProperty('error', 'Internal server error while enrolling in class');
    });
  });
});
