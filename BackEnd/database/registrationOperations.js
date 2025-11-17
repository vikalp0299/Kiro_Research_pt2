const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { GetCommand, PutCommand, UpdateCommand, QueryCommand } = require('@aws-sdk/lib-dynamodb');
const { client, docClient } = require('./dynamoClient');
const { getAllClasses, getClassById } = require('./classOperations');
const { getUserById } = require('./userOperations');

const TABLE_NAME = 'classRegistrationDB';

/**
 * Create classRegistrationDB table with composite key and GSI
 * Table structure:
 * - Composite Primary Key: classId (HASH), userId (RANGE)
 * - Attributes: className, registrationState
 * - GSI: UserIdIndex for querying by userId
 */
async function createRegistrationDB() {
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
        { AttributeName: 'classId', AttributeType: 'S' },
        { AttributeName: 'userId', AttributeType: 'N' }
      ],
      KeySchema: [
        { AttributeName: 'classId', KeyType: 'HASH' },
        { AttributeName: 'userId', KeyType: 'RANGE' }
      ],
      GlobalSecondaryIndexes: [
        {
          IndexName: 'UserIdIndex',
          KeySchema: [
            { AttributeName: 'userId', KeyType: 'HASH' },
            { AttributeName: 'classId', KeyType: 'RANGE' }
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
 * Get enrolled classes for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of enrolled class info objects
 */
async function dispEnrolledClass(userId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'registrationState = :state',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':state': 'enrolled'
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting enrolled classes:', error);
    throw error;
  }
}

/**
 * Get available classes for a user (excluding enrolled classes)
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of available class objects
 */
async function dispAvailableClass(userId) {
  try {
    // Get all classes
    const allClasses = await getAllClasses();

    // Get user's enrolled classes
    const enrolledClasses = await dispEnrolledClass(userId);
    const enrolledClassIds = new Set(enrolledClasses.map(c => c.classId));

    // Filter out enrolled classes
    const availableClasses = allClasses.filter(c => !enrolledClassIds.has(c.classId));

    return availableClasses;
  } catch (error) {
    console.error('Error getting available classes:', error);
    throw error;
  }
}

/**
 * Get dropped classes for a user
 * @param {number} userId - User ID
 * @returns {Promise<Array>} - Array of dropped class info objects
 */
async function dispDroppedClass(userId) {
  try {
    const params = {
      TableName: TABLE_NAME,
      IndexName: 'UserIdIndex',
      KeyConditionExpression: 'userId = :userId',
      FilterExpression: 'registrationState = :state',
      ExpressionAttributeValues: {
        ':userId': userId,
        ':state': 'dropped'
      }
    };

    const result = await docClient.send(new QueryCommand(params));
    return result.Items || [];
  } catch (error) {
    console.error('Error getting dropped classes:', error);
    throw error;
  }
}

/**
 * Create new registration record
 * @param {Object} registration - Registration object
 * @param {string} registration.classId - Class ID
 * @param {number} registration.userId - User ID
 * @param {string} registration.className - Class name
 * @param {string} registration.registrationState - Registration state ('enrolled' or 'dropped')
 * @returns {Promise<void>}
 * @throws {Error} If classId or userId validation fails
 */
async function pushRegistry(registration) {
  try {
    // Validate classId and userId before operation (Requirement 20.6)
    if (!registration.classId || typeof registration.classId !== 'string') {
      throw new Error('Invalid classId: must be a non-empty string');
    }
    
    if (!registration.userId || typeof registration.userId !== 'number') {
      throw new Error('Invalid userId: must be a number');
    }

    // Verify class exists
    const classExists = await getClassById(registration.classId);
    if (!classExists) {
      throw new Error(`Class with ID ${registration.classId} does not exist`);
    }

    // Verify user exists
    const userExists = await getUserById(registration.userId);
    if (!userExists) {
      throw new Error(`User with ID ${registration.userId} does not exist`);
    }

    const params = {
      TableName: TABLE_NAME,
      Item: {
        classId: registration.classId,
        userId: registration.userId,
        className: registration.className,
        registrationState: registration.registrationState
      }
    };

    await docClient.send(new PutCommand(params));
  } catch (error) {
    console.error('Error creating registration:', error);
    throw error;
  }
}

/**
 * Update registration status
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 * @param {string} status - New registration status ('enrolled' or 'dropped')
 * @returns {Promise<void>}
 * @throws {Error} If classId or userId validation fails
 */
async function updateRegistry(classId, userId, status) {
  try {
    // Validate classId and userId before operation (Requirement 20.6)
    if (!classId || typeof classId !== 'string') {
      throw new Error('Invalid classId: must be a non-empty string');
    }
    
    if (!userId || typeof userId !== 'number') {
      throw new Error('Invalid userId: must be a number');
    }

    if (!status || (status !== 'enrolled' && status !== 'dropped')) {
      throw new Error('Invalid status: must be "enrolled" or "dropped"');
    }

    // Verify class exists
    const classExists = await getClassById(classId);
    if (!classExists) {
      throw new Error(`Class with ID ${classId} does not exist`);
    }

    // Verify user exists
    const userExists = await getUserById(userId);
    if (!userExists) {
      throw new Error(`User with ID ${userId} does not exist`);
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        classId: classId,
        userId: userId
      },
      UpdateExpression: 'SET registrationState = :status',
      ExpressionAttributeValues: {
        ':status': status
      },
      ReturnValues: 'ALL_NEW'
    };

    await docClient.send(new UpdateCommand(params));
  } catch (error) {
    console.error('Error updating registration:', error);
    throw error;
  }
}

/**
 * Get registration record
 * @param {string} classId - Class ID
 * @param {number} userId - User ID
 * @returns {Promise<Object|null>} - Registration object or null if not found
 * @throws {Error} If classId or userId validation fails
 */
async function getRegistration(classId, userId) {
  try {
    // Validate classId and userId before operation (Requirement 20.6)
    if (!classId || typeof classId !== 'string') {
      throw new Error('Invalid classId: must be a non-empty string');
    }
    
    if (!userId || typeof userId !== 'number') {
      throw new Error('Invalid userId: must be a number');
    }

    const params = {
      TableName: TABLE_NAME,
      Key: {
        classId: classId,
        userId: userId
      }
    };

    const result = await docClient.send(new GetCommand(params));
    return result.Item || null;
  } catch (error) {
    console.error('Error getting registration:', error);
    throw error;
  }
}

module.exports = {
  createRegistrationDB,
  dispEnrolledClass,
  dispAvailableClass,
  dispDroppedClass,
  pushRegistry,
  updateRegistry,
  getRegistration
};
