/**
 * Environment Variable Validation Module
 * Validates all required environment variables on server startup
 */

const fs = require('fs');
const path = require('path');

/**
 * Required environment variables with their validation rules
 */
const ENV_SCHEMA = {
  // JWT Configuration
  JWT_SECRET: {
    required: true,
    validator: (value) => value && value.length >= 32,
    errorMessage: 'JWT_SECRET must be at least 32 characters (256 bits recommended)'
  },
  JWT_EXPIRES_IN: {
    required: true,
    validator: (value) => /^\d+[smhd]$/.test(value),
    errorMessage: 'JWT_EXPIRES_IN must be in format: number + unit (s/m/h/d), e.g., "30m"'
  },
  JWT_REFRESH_EXPIRES_IN: {
    required: true,
    validator: (value) => /^\d+[smhd]$/.test(value),
    errorMessage: 'JWT_REFRESH_EXPIRES_IN must be in format: number + unit (s/m/h/d), e.g., "7d"'
  },
  JWT_ISSUER: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'JWT_ISSUER is required'
  },
  JWT_AUDIENCE: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'JWT_AUDIENCE is required'
  },

  // AWS Configuration
  AWS_ACCESS_KEY_ID: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'AWS_ACCESS_KEY_ID is required'
  },
  AWS_SECRET_ACCESS_KEY: {
    required: true,
    validator: (value) => value && value.length > 0,
    errorMessage: 'AWS_SECRET_ACCESS_KEY is required'
  },
  AWS_REGION: {
    required: true,
    validator: (value) => value && /^[a-z]{2}-[a-z]+-\d+$/.test(value),
    errorMessage: 'AWS_REGION must be a valid AWS region (e.g., us-east-1)'
  },

  // Application Configuration
  NODE_ENV: {
    required: true,
    validator: (value) => ['development', 'production', 'test'].includes(value),
    errorMessage: 'NODE_ENV must be one of: development, production, test'
  },
  PORT: {
    required: true,
    validator: (value) => {
      const port = parseInt(value, 10);
      return !isNaN(port) && port >= 1 && port <= 65535;
    },
    errorMessage: 'PORT must be a valid port number (1-65535)'
  },
  FRONTEND_URL: {
    required: true,
    validator: (value) => value && /^https?:\/\/.+/.test(value),
    errorMessage: 'FRONTEND_URL must be a valid URL starting with http:// or https://'
  },

  // Security Configuration
  BCRYPT_SALT_ROUNDS: {
    required: true,
    validator: (value) => {
      const rounds = parseInt(value, 10);
      return !isNaN(rounds) && rounds >= 10 && rounds <= 20;
    },
    errorMessage: 'BCRYPT_SALT_ROUNDS must be between 10 and 20 (14 recommended)'
  },
  RATE_LIMIT_WINDOW_MS: {
    required: true,
    validator: (value) => {
      const ms = parseInt(value, 10);
      return !isNaN(ms) && ms > 0;
    },
    errorMessage: 'RATE_LIMIT_WINDOW_MS must be a positive number'
  },
  RATE_LIMIT_MAX_REQUESTS: {
    required: true,
    validator: (value) => {
      const max = parseInt(value, 10);
      return !isNaN(max) && max > 0;
    },
    errorMessage: 'RATE_LIMIT_MAX_REQUESTS must be a positive number'
  },
  AUTH_RATE_LIMIT_MAX: {
    required: true,
    validator: (value) => {
      const max = parseInt(value, 10);
      return !isNaN(max) && max > 0;
    },
    errorMessage: 'AUTH_RATE_LIMIT_MAX must be a positive number'
  },

  // CORS Configuration
  ALLOWED_ORIGINS: {
    required: true,
    validator: (value) => {
      if (!value) return false;
      const origins = value.split(',').map(o => o.trim());
      return origins.every(origin => /^https?:\/\/.+/.test(origin));
    },
    errorMessage: 'ALLOWED_ORIGINS must be comma-separated valid URLs'
  },

  // Database Configuration (optional)
  DYNAMODB_ENDPOINT: {
    required: false,
    validator: (value) => !value || /^https?:\/\/.+/.test(value),
    errorMessage: 'DYNAMODB_ENDPOINT must be a valid URL if provided'
  }
};

/**
 * Validates a single environment variable
 * @param {string} key - Environment variable name
 * @param {string} value - Environment variable value
 * @param {object} schema - Validation schema for the variable
 * @returns {object} Validation result { valid: boolean, error: string }
 */
function validateEnvVar(key, value, schema) {
  // Check if required
  if (schema.required && !value) {
    return {
      valid: false,
      error: `${key} is required but not set`
    };
  }

  // Skip validation if not required and not provided
  if (!schema.required && !value) {
    return { valid: true };
  }

  // Run validator
  if (schema.validator && !schema.validator(value)) {
    return {
      valid: false,
      error: schema.errorMessage || `${key} validation failed`
    };
  }

  return { valid: true };
}

/**
 * Validates all environment variables
 * @returns {object} Validation result { valid: boolean, errors: string[] }
 */
function validateEnvironment() {
  const errors = [];

  // Check each variable in schema
  for (const [key, schema] of Object.entries(ENV_SCHEMA)) {
    const value = process.env[key];
    const result = validateEnvVar(key, value, schema);

    if (!result.valid) {
      errors.push(result.error);
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Checks if .env file exists
 * @returns {boolean} True if .env file exists
 */
function checkEnvFileExists() {
  const envPath = path.join(__dirname, '..', '.env');
  return fs.existsSync(envPath);
}

/**
 * Prints validation errors in a formatted way
 * @param {string[]} errors - Array of error messages
 */
function printValidationErrors(errors) {
  console.error('\n❌ Environment Variable Validation Failed!\n');
  console.error('The following issues were found:\n');
  
  errors.forEach((error, index) => {
    console.error(`  ${index + 1}. ${error}`);
  });
  
  console.error('\n📝 Please check your .env file and fix the issues above.');
  console.error('💡 You can run "python3 envSetter.py" to reconfigure your environment.\n');
}

/**
 * Validates environment on startup
 * Exits process if validation fails
 */
function validateOnStartup() {
  // Check if .env file exists
  if (!checkEnvFileExists()) {
    console.error('\n❌ Error: .env file not found!\n');
    console.error('📝 Please create a .env file with required environment variables.');
    console.error('💡 Run "python3 envSetter.py" to create the .env file interactively.\n');
    console.error('📄 Or copy .env.example to .env and fill in the values:\n');
    console.error('   cp .env.example .env\n');
    process.exit(1);
  }

  // Validate environment variables
  const result = validateEnvironment();

  if (!result.valid) {
    printValidationErrors(result.errors);
    process.exit(1);
  }

  // Success message
  console.log('✅ Environment variables validated successfully');
}

/**
 * Gets validated configuration object
 * @returns {object} Configuration object with all environment variables
 */
function getConfig() {
  return {
    jwt: {
      secret: process.env.JWT_SECRET,
      expiresIn: process.env.JWT_EXPIRES_IN,
      refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN,
      issuer: process.env.JWT_ISSUER,
      audience: process.env.JWT_AUDIENCE
    },
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION
    },
    app: {
      nodeEnv: process.env.NODE_ENV,
      port: parseInt(process.env.PORT, 10),
      frontendUrl: process.env.FRONTEND_URL
    },
    security: {
      bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS, 10),
      rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS, 10),
      rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS, 10),
      authRateLimitMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX, 10)
    },
    cors: {
      allowedOrigins: process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
    },
    database: {
      dynamodbEndpoint: process.env.DYNAMODB_ENDPOINT || undefined
    }
  };
}

module.exports = {
  validateEnvironment,
  validateOnStartup,
  getConfig,
  checkEnvFileExists
};
