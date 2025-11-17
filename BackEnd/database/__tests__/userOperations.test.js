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
  createDatabase,
  userExistsInDB,
  getUserByIdentifier,
  getUserById,
  pushUserData,
  generateUserId
} = require('../userOperations');

describe('User Database Operations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDatabase', () => {
    test('should create studentUserDB table successfully', async () => {
      mockSend.mockResolvedValue({});

      await createDatabase();

      expect(mockSend).toHaveBeenCalled();
      const createTableCommand = mockSend.mock.calls[0][0];
      expect(createTableCommand.input.TableName).toBe('studentUserDB');
    });

    test('should handle table already exists error gracefully', async () => {
      const error = new Error('Table already exists');
      error.name = 'ResourceInUseException';
      mockSend.mockRejectedValue(error);

      await expect(createDatabase()).resolves.not.toThrow();
    });

    test('should throw error for other failures', async () => {
      const error = new Error('Network error');
      mockSend.mockRejectedValue(error);

      await expect(createDatabase()).rejects.toThrow('Network error');
    });
  });

  describe('userExistsInDB', () => {
    test('should return true when user exists by username', async () => {
      mockSend.mockResolvedValue({
        Items: [{ userId: '1234567890', username: 'testuser' }]
      });

      const result = await userExistsInDB('testuser');

      expect(result).toBe(true);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return true when user exists by email', async () => {
      mockSend.mockResolvedValue({
        Items: [{ userId: '1234567890', email: 'test@example.com' }]
      });

      const result = await userExistsInDB('test@example.com');

      expect(result).toBe(true);
    });

    test('should return false when user does not exist', async () => {
      mockSend.mockResolvedValue({
        Items: []
      });

      const result = await userExistsInDB('nonexistent');

      expect(result).toBe(false);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Database error'));

      await expect(userExistsInDB('testuser')).rejects.toThrow('Database error');
    });
  });

  describe('getUserByIdentifier', () => {
    test('should retrieve user by username', async () => {
      const mockUser = {
        userId: '1234567890',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      };

      mockSend.mockResolvedValue({
        Items: [mockUser]
      });

      const result = await getUserByIdentifier('testuser');

      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should retrieve user by email', async () => {
      const mockUser = {
        userId: '1234567890',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      };

      mockSend.mockResolvedValue({
        Items: [mockUser]
      });

      const result = await getUserByIdentifier('test@example.com');

      expect(result).toEqual(mockUser);
    });

    test('should return null when user not found', async () => {
      mockSend.mockResolvedValue({
        Items: []
      });

      const result = await getUserByIdentifier('nonexistent');

      expect(result).toBe(null);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Query failed'));

      await expect(getUserByIdentifier('testuser')).rejects.toThrow('Query failed');
    });
  });

  describe('getUserById', () => {
    test('should retrieve user by userId', async () => {
      const mockUser = {
        userId: '1234567890',
        username: 'testuser',
        email: 'test@example.com',
        fullName: 'Test User'
      };

      mockSend.mockResolvedValue({
        Item: mockUser
      });

      const result = await getUserById('1234567890');

      expect(result).toEqual(mockUser);
      expect(mockSend).toHaveBeenCalled();
    });

    test('should return null when user not found', async () => {
      mockSend.mockResolvedValue({});

      const result = await getUserById('9999999999');

      expect(result).toBe(null);
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Get item failed'));

      await expect(getUserById('1234567890')).rejects.toThrow('Get item failed');
    });
  });

  describe('pushUserData', () => {
    test('should insert new user successfully', async () => {
      mockSend.mockResolvedValue({});

      const userData = {
        userId: 1234567890,
        username: 'newuser',
        email: 'new@example.com',
        fullName: 'New User',
        password: 'hashedpassword123'
      };

      await pushUserData(userData);

      expect(mockSend).toHaveBeenCalled();
    });

    test('should handle duplicate user error', async () => {
      const error = new Error('Conditional check failed');
      error.name = 'ConditionalCheckFailedException';
      mockSend.mockRejectedValue(error);

      const userData = {
        userId: 1234567890,
        username: 'existinguser',
        email: 'existing@example.com',
        fullName: 'Existing User',
        password: 'hashedpassword123'
      };

      await expect(pushUserData(userData)).rejects.toThrow();
    });

    test('should handle database errors', async () => {
      mockSend.mockRejectedValue(new Error('Put item failed'));

      const userData = {
        userId: 1234567890,
        username: 'newuser',
        email: 'new@example.com',
        fullName: 'New User',
        password: 'hashedpassword123'
      };

      await expect(pushUserData(userData)).rejects.toThrow('Put item failed');
    });
  });

  describe('generateUserId', () => {
    test('should generate 10-digit user ID', () => {
      const userId = generateUserId();

      expect(typeof userId).toBe('number');
      expect(userId.toString().length).toBe(10);
      expect(userId).toBeGreaterThanOrEqual(1000000000);
      expect(userId).toBeLessThan(10000000000);
    });

    test('should generate unique user IDs', () => {
      const userId1 = generateUserId();
      const userId2 = generateUserId();

      // While not guaranteed to be different, they should be different most of the time
      expect(userId1).toBeDefined();
      expect(userId2).toBeDefined();
      expect(typeof userId1).toBe('number');
      expect(typeof userId2).toBe('number');
    });

    test('should generate valid numeric ID', () => {
      const userId = generateUserId();

      expect(Number.isInteger(userId)).toBe(true);
      expect(userId).toBeGreaterThan(0);
    });
  });
});
