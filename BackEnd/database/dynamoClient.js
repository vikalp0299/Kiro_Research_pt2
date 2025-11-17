const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
require('dotenv').config();

/**
 * Initialize DynamoDB client with proper configuration
 * Uses AWS credentials from environment variables
 */
const client = new DynamoDBClient({
  region: process.env.AWS_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  },
  // Use local DynamoDB endpoint if specified (for development)
  ...(process.env.DYNAMODB_ENDPOINT && {
    endpoint: process.env.DYNAMODB_ENDPOINT
  })
});

/**
 * DynamoDB Document Client for simplified operations with native JavaScript types
 * Automatically marshalls/unmarshalls data
 */
const docClient = DynamoDBDocumentClient.from(client, {
  marshallOptions: {
    convertEmptyValues: true,     // Handle empty strings/sets
    removeUndefinedValues: true,  // Remove undefined properties
    convertClassInstanceToMap: true // Convert class instances to maps
  },
  unmarshallOptions: {
    wrapNumbers: false // Return numbers as JavaScript numbers instead of NumberValue objects
  }
});

module.exports = {
  client,
  docClient
};
