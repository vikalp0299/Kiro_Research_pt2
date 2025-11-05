const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient } = require('@aws-sdk/lib-dynamodb');
const path = require('path');

// Load environment variables from Research_pt2/.env
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// Check for required AWS credentials
function validateAWSCredentials() {
  const requiredVars = ['AWS_ACCESS_KEY_ID', 'AWS_SECRET_ACCESS_KEY'];
  const missing = requiredVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    console.error('❌ Missing required AWS environment variables:');
    missing.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\n📋 To fix this:');
    console.error('1. Copy Database/.env.example to Database/.env');
    console.error('2. Update Database/.env with your AWS credentials');
    console.error('3. Or configure AWS CLI: aws configure');
    console.error('\n💡 For development, you can use AWS free tier credentials');
    throw new Error('AWS credentials not configured');
  }
}

// Lazy initialization of DynamoDB clients
let client = null;
let docClient = null;

function initializeClients() {
  if (!client) {
    // Validate credentials before creating client
    validateAWSCredentials();
    
    // Configure DynamoDB client
    client = new DynamoDBClient({
      region: process.env.AWS_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });

    // Create document client for easier operations
    docClient = DynamoDBDocumentClient.from(client);
    
    console.log(`🔧 DynamoDB configured for region: ${process.env.AWS_REGION || 'us-east-1'}`);
  }
  
  return { client, docClient };
}

function getClient() {
  if (!client) {
    initializeClients();
  }
  return client;
}

function getDocClient() {
  if (!docClient) {
    initializeClients();
  }
  return docClient;
}

module.exports = {
  get client() { return getClient(); },
  get docClient() { return getDocClient(); },
  validateAWSCredentials,
  initializeClients
};