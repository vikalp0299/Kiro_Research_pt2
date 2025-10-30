const {
  createDatabase,
  userExistsInDB,
  dispEnrolledClass,
  getAllClasses,
  dispAvailableClass,
  dispDroppedClass,
  pushUserData,
  addDummyDataToClassDB,
  pushRegistry,
  updateRegistry
} = require('../index');

// Mock AWS SDK
jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/lib-dynamodb');
jest.mock('bcrypt');

// Mock the config module
jest.mock('../config', () => {
  const mockClient = {
    send: jest.fn()
  };
  const mockDocClient = {
    send: jest.fn()
  };
  return {
    client: mockClient,
    docClient: mockDocClient
  };
});

const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, ScanCommand, PutItemCommand, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const bcrypt = require('bcrypt');
const { client: mockClient, docClient: mockDocClient } = require('../config');

describe('Database Layer Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDatabase', () => {
    test('should create tables successfully when they do not exist', async () => {
      // Mock table doesn't exist (ResourceNotFoundException)
      mockClient.send
        .mockRejectedValueOnce({ name: 'ResourceNotFoundException' }) // studentUserDB check
        .mockResolvedValueOnce({}) // studentUserDB create
        .mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } }) // studentUserDB wait
        .mockRejectedValueOnce({ name: 'ResourceNotFoundException' }) // classDB check
        .mockResolvedValueOnce({}) // classDB create
        .mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } }) // classDB wait
        .mockRejectedValueOnce({ name: 'ResourceNotFoundException' }) // classRegistrationDB check
        .mockResolvedValueOnce({}) // classRegistrationDB create
        .mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } }); // classRegistrationDB wait

      const result = await createDatabase();

      expect(result.success).toBe(true);
      expect(result.message).toBe('All tables created or verified');
      expect(mockClient.send).toHaveBeenCalledTimes(9); // 3 checks + 3 creates + 3 waits
    });

    test('should handle existing tables', async () => {
      // Mock tables already exist
      mockClient.send
        .mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } }) // studentUserDB exists
        .mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } }) // classDB exists
        .mockResolvedValueOnce({ Table: { TableStatus: 'ACTIVE' } }); // classRegistrationDB exists

      const result = await createDatabase();

      expect(result.success).toBe(true);
      expect(mockClient.send).toHaveBeenCalledTimes(3);
    });
  });

  describe('userExistsInDB', () => {
    test('should return user data when user exists', async () => {
      const mockUser = {
        Items: [{
          userID: { N: '1234567890' },
          username: { S: 'testuser' },
          fullName: { S: 'Test User' },
          email: { S: 'test@example.com' },
          password: { S: 'hashedpassword' }
        }]
      };

      mockDocClient.send.mockResolvedValueOnce(mockUser);

      const result = await userExistsInDB('testuser', 'test@example.com');

      expect(result).toEqual({
        userID: 1234567890,
        username: 'testuser',
        fullName: 'Test User',
        email: 'test@example.com',
        password: 'hashedpassword'
      });
    });

    test('should return null when user does not exist', async () => {
      mockDocClient.send.mockResolvedValueOnce({ Items: [] });

      const result = await userExistsInDB('nonexistent', 'none@example.com');

      expect(result).toBeNull();
    });
  });

  describe('dispEnrolledClass', () => {
    test('should return enrolled classes for user', async () => {
      const mockEnrolledClasses = {
        Items: [{
          classId: { S: 'IFT 593' },
          className: { S: 'Advanced Database Systems' },
          userID: { N: '1234567890' },
          registrationStatus: { S: 'enrolled' }
        }]
      };

      mockDocClient.send.mockResolvedValueOnce(mockEnrolledClasses);

      const result = await dispEnrolledClass(1234567890);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        classId: 'IFT 593',
        className: 'Advanced Database Systems',
        userID: 1234567890,
        registrationStatus: 'enrolled'
      });
    });

    test('should return empty array when no enrolled classes', async () => {
      mockDocClient.send.mockResolvedValueOnce({ Items: [] });

      const result = await dispEnrolledClass(1234567890);

      expect(result).toEqual([]);
    });
  });

  describe('getAllClasses', () => {
    test('should return all classes from database', async () => {
      const mockClasses = {
        Items: [{
          classId: { S: 'IFT 593' },
          className: { S: 'Advanced Database Systems' },
          credits: { N: '3' },
          description: { S: 'Advanced database concepts' }
        }]
      };

      mockDocClient.send.mockResolvedValueOnce(mockClasses);

      const result = await getAllClasses();

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        classId: 'IFT 593',
        className: 'Advanced Database Systems',
        credits: 3,
        description: 'Advanced database concepts'
      });
    });
  });

  describe('pushUserData', () => {
    test('should create user with encrypted password', async () => {
      bcrypt.hash.mockResolvedValueOnce('hashedpassword123');
      mockDocClient.send.mockResolvedValueOnce({});

      const userData = {
        username: 'newuser',
        fullName: 'New User',
        email: 'new@example.com',
        password: 'plainpassword'
      };

      const result = await pushUserData(userData);

      expect(bcrypt.hash).toHaveBeenCalledWith('plainpassword', 10);
      expect(result.username).toBe('newuser');
      expect(result.fullName).toBe('New User');
      expect(result.email).toBe('new@example.com');
      expect(result.userID).toBeGreaterThanOrEqual(1000000000);
      expect(result.userID).toBeLessThanOrEqual(9999999999);
    });
  });

  describe('addDummyDataToClassDB', () => {
    test('should add sample classes to database', async () => {
      // Mock that classes don't exist
      mockDocClient.send
        .mockRejectedValue({ name: 'ResourceNotFoundException' }) // All GetItem calls fail
        .mockResolvedValue({}); // All PutItem calls succeed

      const result = await addDummyDataToClassDB();

      expect(result.success).toBe(true);
      expect(result.message).toBe('Sample data populated');
    });
  });

  describe('pushRegistry', () => {
    test('should create registration record', async () => {
      mockDocClient.send.mockResolvedValueOnce({});

      const registrationData = {
        classId: 'IFT 593',
        userID: 1234567890,
        className: 'Advanced Database Systems'
      };

      const result = await pushRegistry(registrationData);

      expect(result).toEqual({
        classId: 'IFT 593',
        userID: 1234567890,
        className: 'Advanced Database Systems',
        registrationStatus: 'enrolled'
      });
    });
  });

  describe('updateRegistry', () => {
    test('should update registration status', async () => {
      const mockUpdatedRecord = {
        Attributes: {
          classId: { S: 'IFT 593' },
          userID: { N: '1234567890' },
          className: { S: 'Advanced Database Systems' },
          registrationStatus: { S: 'dropped' }
        }
      };

      mockDocClient.send.mockResolvedValueOnce(mockUpdatedRecord);

      const result = await updateRegistry('IFT 593', 1234567890, 'dropped');

      expect(result).toEqual({
        classId: 'IFT 593',
        userID: 1234567890,
        className: 'Advanced Database Systems',
        registrationStatus: 'dropped'
      });
    });
  });

  describe('dispAvailableClass', () => {
    test('should return classes not enrolled by user', async () => {
      // Mock getAllClasses
      const mockAllClasses = {
        Items: [
          {
            classId: { S: 'IFT 593' },
            className: { S: 'Advanced Database Systems' },
            credits: { N: '3' },
            description: { S: 'Advanced database concepts' }
          },
          {
            classId: { S: 'CSE 201' },
            className: { S: 'Data Structures' },
            credits: { N: '4' },
            description: { S: 'Data structures and algorithms' }
          }
        ]
      };

      // Mock dispEnrolledClass
      const mockEnrolledClasses = {
        Items: [{
          classId: { S: 'IFT 593' },
          className: { S: 'Advanced Database Systems' },
          userID: { N: '1234567890' },
          registrationStatus: { S: 'enrolled' }
        }]
      };

      mockDocClient.send
        .mockResolvedValueOnce(mockAllClasses) // getAllClasses call
        .mockResolvedValueOnce(mockEnrolledClasses); // dispEnrolledClass call

      const result = await dispAvailableClass(1234567890);

      expect(result).toHaveLength(1);
      expect(result[0].classId).toBe('CSE 201');
    });
  });

  describe('dispDroppedClass', () => {
    test('should return dropped classes for user', async () => {
      const mockDroppedClasses = {
        Items: [{
          classId: { S: 'IFT 593' },
          className: { S: 'Advanced Database Systems' },
          userID: { N: '1234567890' },
          registrationStatus: { S: 'dropped' }
        }]
      };

      mockDocClient.send.mockResolvedValueOnce(mockDroppedClasses);

      const result = await dispDroppedClass(1234567890);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        classId: 'IFT 593',
        className: 'Advanced Database Systems',
        userID: 1234567890,
        registrationStatus: 'dropped'
      });
    });
  });
});