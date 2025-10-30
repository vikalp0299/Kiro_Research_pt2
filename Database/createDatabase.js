const { CreateTableCommand, DescribeTableCommand } = require('@aws-sdk/client-dynamodb');
const { client } = require('./config');

/**
 * Creates DynamoDB tables if they don't exist
 * Tables: studentUserDB, classDB, classRegistrationDB
 */
async function createDatabase() {
  try {
    console.log('Initializing database tables...');
    
    // Create studentUserDB table
    await createTableIfNotExists('studentUserDB', {
      AttributeDefinitions: [
        {
          AttributeName: 'userID',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'userID',
          KeyType: 'HASH'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    // Create classDB table
    await createTableIfNotExists('classDB', {
      AttributeDefinitions: [
        {
          AttributeName: 'classId',
          AttributeType: 'S'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'classId',
          KeyType: 'HASH'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    // Create classRegistrationDB table with composite key
    await createTableIfNotExists('classRegistrationDB', {
      AttributeDefinitions: [
        {
          AttributeName: 'classId',
          AttributeType: 'S'
        },
        {
          AttributeName: 'userID',
          AttributeType: 'N'
        }
      ],
      KeySchema: [
        {
          AttributeName: 'classId',
          KeyType: 'HASH'
        },
        {
          AttributeName: 'userID',
          KeyType: 'RANGE'
        }
      ],
      BillingMode: 'PAY_PER_REQUEST'
    });

    console.log('Database initialization completed successfully');
    return { success: true, message: 'All tables created or verified' };
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}

/**
 * Helper function to create table if it doesn't exist
 */
async function createTableIfNotExists(tableName, tableParams) {
  try {
    // Check if table exists
    const describeCommand = new DescribeTableCommand({ TableName: tableName });
    await client.send(describeCommand);
    console.log(`Table ${tableName} already exists`);
  } catch (error) {
    if (error.name === 'ResourceNotFoundException') {
      // Table doesn't exist, create it
      console.log(`Creating table ${tableName}...`);
      const createCommand = new CreateTableCommand({
        TableName: tableName,
        ...tableParams
      });
      
      await client.send(createCommand);
      console.log(`Table ${tableName} created successfully`);
      
      // Wait for table to be active
      await waitForTableActive(tableName);
    } else {
      throw error;
    }
  }
}

/**
 * Wait for table to become active
 */
async function waitForTableActive(tableName) {
  const maxAttempts = 30;
  let attempts = 0;
  
  while (attempts < maxAttempts) {
    try {
      const describeCommand = new DescribeTableCommand({ TableName: tableName });
      const result = await client.send(describeCommand);
      
      if (result.Table.TableStatus === 'ACTIVE') {
        console.log(`Table ${tableName} is now active`);
        return;
      }
      
      console.log(`Waiting for table ${tableName} to become active... (${attempts + 1}/${maxAttempts})`);
      await new Promise(resolve => setTimeout(resolve, 2000));
      attempts++;
    } catch (error) {
      console.error(`Error checking table status: ${error.message}`);
      attempts++;
    }
  }
  
  throw new Error(`Table ${tableName} did not become active within expected time`);
}

module.exports = { createDatabase };