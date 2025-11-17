const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  UpdateCommand,
  DeleteCommand,
  ScanCommand
} = require('@aws-sdk/lib-dynamodb');
const { client } = require('./dynamoClient');

const docClient = DynamoDBDocumentClient.from(client);
const TABLE_NAME = 'mfaCodesDB';

/**
 * Create MFA codes table if it doesn't exist
 */
async function createMFATable() {
  const { CreateTableCommand } = require('@aws-sdk/client-dynamodb');
  
  try {
    const params = {
      TableName: TABLE_NAME,
      KeySchema: [
        { AttributeName: 'userId', KeyType: 'HASH' }
      ],
      AttributeDefinitions: [
        { AttributeName: 'userId', AttributeType: 'N' }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    };

    await client.send(new CreateTableCommand(params));
    console.log(`Table ${TABLE_NAME} created successfully`);
    
    // Wait for table to be active
    await new Promise(resolve => setTimeout(resolve, 2000));
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
 * Store MFA code for a user
 * @param {number} userId - User ID
 * @param {string} code - OTP code
 * @param {number} expiresAt - Expiration timestamp
 * @param {number} attempts - Number of verification attempts (default 0)
 * @returns {Promise<void>}
 */
async function storeMFACode(userId, code, expiresAt, attempts = 0) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Item: {
        userId: userId,
        code: code,
        expiresAt: expiresAt,
        createdAt: Date.now(),
        attempts: attempts,
        locked: false
      }
    };

    await docClient.send(new PutCommand(params));
    console.log(`MFA code stored for user ${userId}`);
  } catch (error) {
    console.error('Error storing MFA code:', error);
    throw error;
  }
}

/**
 * Get MFA code for a user
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} MFA code object or null
 */
async function getMFACode(userId) {
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
    console.error('Error getting MFA code:', error);
    throw error;
  }
}

/**
 * Increment MFA verification attempts
 * @param {number} userId - User ID
 * @returns {Promise<number>} New attempt count
 */
async function incrementMFAAttempts(userId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId
      },
      UpdateExpression: 'SET attempts = attempts + :inc',
      ExpressionAttributeValues: {
        ':inc': 1
      },
      ReturnValues: 'ALL_NEW'
    };

    const result = await docClient.send(new UpdateCommand(params));
    return result.Attributes.attempts;
  } catch (error) {
    console.error('Error incrementing MFA attempts:', error);
    throw error;
  }
}

/**
 * Lock MFA code after too many failed attempts
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function lockMFACode(userId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId
      },
      UpdateExpression: 'SET locked = :locked, lockedAt = :lockedAt',
      ExpressionAttributeValues: {
        ':locked': true,
        ':lockedAt': Date.now()
      }
    };

    await docClient.send(new UpdateCommand(params));
    console.log(`MFA code locked for user ${userId}`);
  } catch (error) {
    console.error('Error locking MFA code:', error);
    throw error;
  }
}

/**
 * Delete MFA code for a user
 * @param {number} userId - User ID
 * @returns {Promise<void>}
 */
async function deleteMFACode(userId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      Key: {
        userId: userId
      }
    };

    await docClient.send(new DeleteCommand(params));
    console.log(`MFA code deleted for user ${userId}`);
  } catch (error) {
    console.error('Error deleting MFA code:', error);
    throw error;
  }
}

/**
 * Clean up expired MFA codes
 * Should be run periodically (e.g., via cron job)
 * @returns {Promise<number>} Number of codes deleted
 */
async function cleanupExpiredMFACodes() {
  try {
    const now = Date.now();
    const params = {
      TableName: TABLE_NAME
    };

    const result = await docClient.send(new ScanCommand(params));
    const items = result.Items || [];
    
    let deletedCount = 0;
    for (const item of items) {
      if (item.expiresAt < now) {
        await deleteMFACode(item.userId);
        deletedCount++;
      }
    }

    console.log(`Cleaned up ${deletedCount} expired MFA codes`);
    return deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired MFA codes:', error);
    throw error;
  }
}

module.exports = {
  createMFATable,
  storeMFACode,
  getMFACode,
  incrementMFAAttempts,
  lockMFACode,
  deleteMFACode,
  cleanupExpiredMFACodes
};
