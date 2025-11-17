/**
 * Example usage of environment validator
 * This demonstrates how to integrate the validator in your server.js file
 */

// Step 1: Load environment variables FIRST
require('dotenv').config();

// Step 2: Validate environment on startup
const { validateOnStartup, getConfig } = require('./envValidator');

// This will validate all environment variables and exit if any are invalid
validateOnStartup();

// Step 3: Get validated configuration object
const config = getConfig();

// Step 4: Use configuration throughout your application
console.log('\n📋 Configuration loaded:');
console.log('  - Environment:', config.app.nodeEnv);
console.log('  - Port:', config.app.port);
console.log('  - JWT Expiration:', config.jwt.expiresIn);
console.log('  - Bcrypt Salt Rounds:', config.security.bcryptSaltRounds);
console.log('  - Rate Limit:', config.security.rateLimitMaxRequests, 'requests per', config.security.rateLimitWindowMs / 1000, 'seconds');
console.log('  - Allowed Origins:', config.cors.allowedOrigins.join(', '));
console.log('  - AWS Region:', config.aws.region);

// Example: Use in Express app
const express = require('express');
const app = express();

// Use configuration values
app.listen(config.app.port, () => {
  console.log(`\n✅ Server running on port ${config.app.port}`);
  console.log(`   Environment: ${config.app.nodeEnv}`);
  console.log(`   Frontend URL: ${config.app.frontendUrl}\n`);
});

// Example: Use in JWT middleware
const jwt = require('jsonwebtoken');

function generateToken(payload) {
  return jwt.sign(payload, config.jwt.secret, {
    expiresIn: config.jwt.expiresIn,
    issuer: config.jwt.issuer,
    audience: config.jwt.audience
  });
}

// Example: Use in bcrypt
const bcrypt = require('bcrypt');

async function hashPassword(password) {
  return await bcrypt.hash(password, config.security.bcryptSaltRounds);
}

// Example: Use in rate limiting
const rateLimit = require('express-rate-limit');

const limiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.rateLimitMaxRequests,
  message: 'Too many requests, please try again later.'
});

const authLimiter = rateLimit({
  windowMs: config.security.rateLimitWindowMs,
  max: config.security.authRateLimitMax,
  message: 'Too many authentication attempts, please try again later.'
});

// Example: Use in CORS
const cors = require('cors');

app.use(cors({
  origin: config.cors.allowedOrigins,
  credentials: true
}));

// Example: Use in DynamoDB client
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');

const dynamoConfig = {
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey
  }
};

// Add endpoint if provided (for local development)
if (config.database.dynamodbEndpoint) {
  dynamoConfig.endpoint = config.database.dynamodbEndpoint;
}

const dynamoClient = new DynamoDBClient(dynamoConfig);

console.log('✅ All configuration loaded and validated successfully!\n');
