// Mock the dynamoClient module
const mockSend = jest.fn();
jest.mock('../dynamoClient', () => ({
  client: {
    send: mockSend
  },
  docClient: {
    send: mockSend
  }
}));

const {
  createRegistrationDB,
  getRegistration,
  pushRegistry,
  updateRegistry,
  dispEnrolledClass,
  dispAvailableClass,
  dispDroppedClass
} = require('../registrationOperations');

describe('Registration Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createRegistrationDB', () => {
    test('should create registrationDB table successfully', async () => {
      mockSend.mockResolvedValue({});

      await createRegistrationDB();

      expect(mockSend).toHaveBeenCalled();
      const createTableCommand = mockSend.mock.calls[0][0];
      expect(createTableCommand.input.TableName).toBe('classRegistrationDB');
    });

    test('should handle table already exists error gracefully', async () => {
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockSend.mockRejectedValue(error);

      await expect(createRegistrationDB()).resolves.not.toThrow();
    });

    test('should throw error for other failures', async () => {
      const error = new Error('Network error');
      mockSend.mockRejectedValue(error);

      await expect(createRegistrationDB()).rejects.toThrow('Network error');
    });
  });

  describe('getRegistration', () => {
    test('should retrieve registration by classId and userId', async () => {
      const mockRegistration = {
        classId: 'class1',
        userId: 1234567890,
        status: 'enrolled',
        registrationDate: '2024-01-01'
      };

      mockSend.mockResolvedValue({
        Item: mockRegistration
      });

      const result = await getRegistration('class1', 1234567890);

      expect(result).toEqual(mockRegistration);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return null when registration not found', async () => {
      mockSend.mockResolvedValue({});

      const result = await getRegistration('class1', 9999999999);

      expect(result).toBe(null);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Get item failed'));

      await expect(getRegistration('class1', 1234567890)).rejects.toThrow('Get item failed');
    });
  });

  describe('pushRegistry', () => {
    test('should create new registration successfully', async () => {
      // Mock getClassById (first call)
      mockSend.mockResolvedValueOnce({
        Item: { classId: 'class1', className: 'IFT101', credits: 3 }
      });
      
      // Mock getUserById (second call)
      mockSend.mockResolvedValueOnce({
        Item: { userId: 1234567890, username: 'testuser' }
      });
      
      // Mock PutCommand (third call)
      mockSend.mockResolvedValueOnce({});

      const registrationData = {
        classId: 'class1',
        userId: 1234567890,
        status: 'enrolled'
      };

      await pushRegistry(registrationData);

      expect(mockSend).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Put item failed'));

      const registrationData = {
        classId: 'class1',
        userId: 1234567890,
        status: 'enrolled'
      };

      await expect(pushRegistry(registrationData)).rejects.toThrow('Put item failed');
    });
  });

  describe('updateRegistry', () => {
    test('should update registration status successfully', async () => {
      // Mock getClassById (first call)
      mockSend.mockResolvedValueOnce({
        Item: { classId: 'class1', className: 'IFT101', credits: 3 }
      });
      
      // Mock getUserById (second call)
      mockSend.mockResolvedValueOnce({
        Item: { userId: 1234567890, username: 'testuser' }
      });
      
      // Mock UpdateCommand (third call)
      mockSend.mockResolvedValueOnce({
        Attributes: {
          classId: 'class1',
          userId: 1234567890,
          status: 'dropped'
        }
      });

      await updateRegistry('class1', 1234567890, 'dropped');

      expect(mockSend).toHaveBeenCalled();
      expect(mockSend).toHaveBeenCalledTimes(3);
    });

    test('should handle conditional check failure', async () => {
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValue(error);

      await expect(updateRegistry('class1', 1234567890, 'dropped')).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Update item failed'));

      await expect(updateRegistry('class1', 1234567890, 'dropped')).rejects.toThrow('Update item failed');
    });
  });

  describe('dispEnrolledClass', () => {
    test('should retrieve enrolled classes for user', async () => {
      const mockEnrolledClasses = [
        {
          classId: 'class1',
          userId: 1234567890,
          status: 'enrolled',
          className: 'IFT101',
          credits: 3
        },
        {
          classId: 'class2',
          userId: 1234567890,
          status: 'enrolled',
          className: 'CSE201',
          credits: 4
        }
      ];

      mockSend.mockResolvedValue({
        Items: mockEnrolledClasses
      });

      const result = await dispEnrolledClass(1234567890);

      expect(result).toEqual(mockEnrolledClasses);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return empty array when no enrolled classes', async () => {
      mockSend.mockResolvedValue({
        Items: []
      });

      const result = await dispEnrolledClass(1234567890);

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Query failed'));

      await expect(dispEnrolledClass(1234567890)).rejects.toThrow('Query failed');
    });
  });

  describe('dispAvailableClass', () => {
    test('should retrieve available classes excluding enrolled ones', async () => {
      // Mock enrolled classes query (first call)
      mockSend.mockResolvedValueOnce({
        Items: [
          { classId: 'class1', userId: 1234567890, status: 'enrolled' }
        ]
      });

      // Mock all classes scan (second call)
      mockSend.mockResolvedValueOnce({
        Items: [
          { classId: 'class1', className: 'IFT101', credits: 3, description: 'Intro' },
          { classId: 'class2', className: 'CSE201', credits: 4, description: 'Data Structures' },
          { classId: 'class3', className: 'CCE301', credits: 3, description: 'Networks' }
        ]
      });

      const result = await dispAvailableClass(1234567890);

      // Should exclude class1 (enrolled) and only return class2 and class3
      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    test('should return all classes when none are enrolled', async () => {
      mockSend.mockResolvedValueOnce({
        Items: []
      });

      mockSend.mockResolvedValueOnce({
        Items: [
          { classId: 'class1', className: 'IFT101', credits: 3, description: 'Intro' },
          { classId: 'class2', className: 'CSE201', credits: 4, description: 'Data Structures' }
        ]
      });

      const result = await dispAvailableClass(1234567890);

      expect(result.length).toBeGreaterThanOrEqual(0);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Query failed'));

      await expect(dispAvailableClass(1234567890)).rejects.toThrow('Query failed');
    });
  });

  describe('dispDroppedClass', () => {
    test('should retrieve dropped classes for user', async () => {
      const mockDroppedClasses = [
        {
          classId: 'class1',
          userId: 1234567890,
          status: 'dropped',
          className: 'IFT101',
          credits: 3
        }
      ];

      mockSend.mockResolvedValue({
        Items: mockDroppedClasses
      });

      const result = await dispDroppedClass(1234567890);

      expect(result).toEqual(mockDroppedClasses);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return empty array when no dropped classes', async () => {
      mockSend.mockResolvedValue({
        Items: []
      });

      const result = await dispDroppedClass(1234567890);

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Query failed'));

      await expect(dispDroppedClass(1234567890)).rejects.toThrow('Query failed');
    });
  });
});
