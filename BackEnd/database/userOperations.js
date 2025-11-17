const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { GetCommand, PutCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { client, docClient } = require('./dynamoClient');

const TABLE_NAME = 'studentUserDB';

/**
 * Create studentUserDB table with Global Secondary Indexes
 * Table structure:
 * - Primary Key: userId (Number)
 * - Attributes: username, fullName, email, password (hashed)
 * - GSI: EmailIndex for email lookups
 * - GSI: UsernameIndex for username lookups
 */
async function createDatabase() {
  try {
    // Check if table already exists
    try {
      await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      console.log(`Table ${TABLE_NAME} already exists`);
      return;
    } catch (error) {
      if (error.name !== 'ResourceNotFoundException') {
        throw error;
      }
      // Table doesn't exist, proceed with creation
    }

    const params = {
      TableName: TABLE_NAME,
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'N' },
        { AttributeName: 'email', AttributeType: 'S' },
        { AttributeName: 'username', AttributeType: 'S' }
      ],
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'EmailIndex',
          KeySchema: [
            { AttributeName: 'email', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        },
        {
          IndexName: 'UsernameIndex',
          KeySchema: [
            { AttributeName: 'username', KeyType: 'HASH' }
          ],
          Projection: {
            ProjectionType: 'ALL'
          },
          ProvisionedThroughput: {
            ReadCapacityUnits: 5,
            WriteCapacityUnits: 5
          }
        }
      ],
      BillingMode: 'PROVISIONED',
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    };

    await client.send(new CreateTableCommand(params));
    console.log(`Table ${TABLE_NAME} created successfully`);

    // Wait for table to be active
    let tableActive = false;
    while (!tableActive) {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const description = await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
      tableActive = description.Table.TableStatus === 'ACTIVE';
    }
    console.log(`Table ${TABLE_NAME} is now active`);
  } catch (error) {
    if (error.name === 'ResourceInUseException') {
      console.log(`Table ${TABLE_NAME} already exists`);
    } else {
      console.error(`Error creating table ${TABLE_NAME}:`, error);
      throw error;
    }
  }
}

/**
 * Check if a user exists by username or email
 * @param {string} identifier - Username or email to check
 * @returns {Promise<boolean>} - True if user exists
 */
async function userExistsInDB(identifier) {
  try {
    const user = await getUserByIdentifier(identifier);
    return user !== null;
  } catch (error) {
    console.error('Error checking user existence:', error);
    throw error;
  }
}

/**
 * Get user by username or email using Global Secondary Indexes
 * @param {string} identifier - Username or email
 * @returns {Promise<Object|null>} - User object or null if not found
 */
async function getUserByIdentifier(identifier) {
  try {
    // Check if identifier is an email (contains @)
    const isEmail = identifier.includes('@');
    const indexName = isEmail ? 'EmailIndex' : 'UsernameIndex';
    const attributeName = isEmail ? 'email' : 'username';

    const params = {
      TableName: TABLE_NAME,
      IndexName: indexName,
      KeyConditionExpression: `#attr = :value`,
      ExpressionAttributeNames: {
        '#attr': attributeName
      },
      ExpressionAttributeValues: {
        ':value': identifier
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items && result.Items.length > 0 ? result.Items[0] : null;
  } catch (error) {
    console.error('Error getting user by identifier:', error);
    throw error;
  }
}

/**
 * Get user by userId
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - User object or null if not found
 */
async function getUserById(userId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId
      }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting user by ID:', error);
    throw error;
  }
}

/**
 * Insert new user into database
 * @param {Object} userData - User data object
 * @param {string} userData.username - Username
 * @param {string} userData.fullName - Full name
 * @param {string} userData.email - Email address
 * @param {string} userData.password - Hashed password
 * @returns {Promise<number>} - Generated userId
 */
async function pushUserData(userData) {
  try {
    const userId = generateUserId();

    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: userId,
        username: userData.username,
        fullName: userData.fullName,
        email: userData.email,
        password: userData.password
      }
    };

    await docClient.send(new PutCommand(params));
    return userId;
  } catch (error) {
    console.error('Error inserting user data:', error);
    throw error;
  }
}

/**
 * Generate unique 10-digit user ID
 * @returns {number} - 10-digit user ID
 */
function generateUserId() {
  // Generate random 10-digit number (1000000000 to 9999999999)
  return Math.floor(1000000000 + Math.random() * 9000000000);
}

/**
 * Update user's MFA preference
 * @param {number} userId - User ID
 * @param {boolean} mfaEnabled - Whether MFA is enabled
 * @returns {Promise<void>}
 */
async function updateMFAPreference(userId, mfaEnabled) {
  const { UpdateCommand } = require('@aws-sdk/lib-dynamodb');
  
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId
      },
      UpdateExpression: 'SET mfaEnabled = :mfaEnabled, mfaUpdatedAt = :updatedAt',
      ExpressionAttributeValues: {
        ':mfaEnabled': mfaEnabled,
        ':updatedAt': Date.now()
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    console.log(`MFA preference updated for user ${userId}: ${mfaEnabled ? 'enabled' : 'disabled'}`);
    return result.Attributes;
  } catch (error) {
    console.error('Error updating MFA preference:', error);
    throw error;
  }
}

/**
 * Get user's MFA preference
 * @param {number} userId - User ID
 * @returns {Promise<boolean>} - Whether MFA is enabled (defaults to true for new users)
 */
async function getMFAPreference(userId) {
  try {
    const user = await getUserById(userId);
    // Default to true (MFA enabled) if not explicitly set
    return user?.mfaEnabled !== false;
  } catch (error) {
    console.error('Error getting MFA preference:', error);
    throw error;
  }
}

module.exports = {
  createDatabase,
  userExistsInDB,
  getUserByIdentifier,
  getUserById,
  pushUserData,
  generateUserId,
  updateMFAPreference,
  getMFAPreference
};
