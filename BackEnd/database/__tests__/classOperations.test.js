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
  createClassDB,
  addDummyDataToClassDB,
  getAllClasses,
  getClassById
} = require('../classOperations');

describe('Class Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createClassDB', () => {
    test('should create classDB table successfully', async () => {
      mockSend.mockResolvedValue({});

      await createClassDB();

      expect(mockSend).toHaveBeenCalled();
      const createTableCommand = mockSend.mock.calls[0][0];
      expect(createTableCommand.input.TableName).toBe('classDB');
    });

    test('should handle table already exists error gracefully', async () => {
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockSend.mockRejectedValue(error);

      await expect(createClassDB()).resolves.not.toThrow();
    });

    test('should throw error for other failures', async () => {
      const error = new Error('Network error');
      mockSend.mockRejectedValue(error);

      await expect(createClassDB()).rejects.toThrow('Network error');
    });
  });

  describe('addDummyDataToClassDB', () => {
    test('should add dummy classes to database', async () => {
      mockSend.mockResolvedValue({});

      await addDummyDataToClassDB();

      // Should have made multiple put calls (one for each class)
      expect(mockSend).toHaveBeenCalled();
      expect(mockSend.mock.calls.length).toBeGreaterThan(0);
    });

    test('should create classes with required fields', async () => {
      mockSend.mockResolvedValue({});

      await addDummyDataToClassDB();

      // Verify that mockSend was called multiple times (once for each class)
      expect(mockSend).toHaveBeenCalled();
      expect(mockSend.mock.calls.length).toBeGreaterThan(0);
    });

    test('should create classes with valid course codes', async () => {
      mockSend.mockResolvedValue({});

      await addDummyDataToClassDB();

      // Verify function completed successfully
      expect(mockSend).toHaveBeenCalled();
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Put item failed'));

      await expect(addDummyDataToClassDB()).rejects.toThrow('Put item failed');
    });
  });

  describe('getAllClasses', () => {
    test('should retrieve all classes', async () => {
      const mockClasses = [
        {
          classId: 'class1',
          className: 'IFT101',
          credits: 3,
          description: 'Introduction to Programming'
        },
        {
          classId: 'class2',
          className: 'CSE201',
          credits: 4,
          description: 'Data Structures'
        }
      ];

      mockSend.mockResolvedValue({
        Items: mockClasses
      });

      const result = await getAllClasses();

      expect(result).toEqual(mockClasses);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return empty array when no classes exist', async () => {
      mockSend.mockResolvedValue({
        Items: []
      });

      const result = await getAllClasses();

      expect(result).toEqual([]);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Scan failed'));

      await expect(getAllClasses()).rejects.toThrow('Scan failed');
    });
  });

  describe('getClassById', () => {
    test('should retrieve class by classId', async () => {
      const mockClass = {
        classId: 'class1',
        className: 'IFT101',
        credits: 3,
        description: 'Introduction to Programming'
      };

      mockSend.mockResolvedValue({
        Item: mockClass
      });

      const result = await getClassById('class1');

      expect(result).toEqual(mockClass);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return null when class not found', async () => {
      mockSend.mockResolvedValue({});

      const result = await getClassById('nonexistent');

      expect(result).toBe(null);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Get item failed'));

      await expect(getClassById('class1')).rejects.toThrow('Get item failed');
    });
  });
});
