# Environment Configuration

This directory contains environment configuration and validation utilities.

## Files

- `envValidator.js` - Environment variable validation module
- `__tests__/envValidator.test.js` - Unit tests for environment validation

## Setup

### 1. Create .env file

Run the interactive setup script:

```bash
python3 envSetter.py
```

Or manually copy the example file:

```bash
cp .env.example .env
```

Then edit `.env` with your actual values.

### 2. Validate Environment

The environment validator will automatically run on server startup. To use it in your server file:

```javascript
// Load environment variables first
require('dotenv').config();

// Validate environment variables
const { validateOnStartup, getConfig } = require('./config/envValidator');
validateOnStartup();

// Get validated configuration
const config = getConfig();

// Use configuration in your app
const app = express();
app.listen(config.app.port, () => {
  console.log(`Server running on port ${config.app.port}`);
});
```

## Environment Variables

### Required Variables

#### JWT Configuration
- `JWT_SECRET` - Secret key for JWT signing (minimum 32 characters, 256 bits recommended)
- `JWT_EXPIRES_IN` - Access token expiration (e.g., "30m")
- `JWT_REFRESH_EXPIRES_IN` - Refresh token expiration (e.g., "7d")
- `JWT_ISSUER` - JWT issuer identifier
- `JWT_AUDIENCE` - JWT audience identifier

#### AWS Configuration
- `AWS_ACCESS_KEY_ID` - AWS access key
- `AWS_SECRET_ACCESS_KEY` - AWS secret key
- `AWS_REGION` - AWS region (e.g., "us-east-1")

#### Application Configuration
- `NODE_ENV` - Environment (development/production/test)
- `PORT` - Server port (1-65535)
- `FRONTEND_URL` - Frontend URL for CORS

#### Security Configuration
- `BCRYPT_SALT_ROUNDS` - Bcrypt salt rounds (10-20, recommended: 14)
- `RATE_LIMIT_WINDOW_MS` - Rate limit window in milliseconds
- `RATE_LIMIT_MAX_REQUESTS` - Maximum requests per window
- `AUTH_RATE_LIMIT_MAX` - Maximum auth attempts per window

#### CORS Configuration
- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins

### Optional Variables

- `DYNAMODB_ENDPOINT` - Local DynamoDB endpoint (for development)

## Validation Rules

The validator checks:

1. **Presence**: All required variables must be set
2. **Format**: Variables must match expected format (e.g., URLs, numbers)
3. **Range**: Numeric values must be within valid ranges
4. **Security**: Secrets must meet minimum length requirements

## Error Handling

If validation fails, the server will:
1. Print detailed error messages
2. Exit with code 1
3. Suggest running `envSetter.py` to fix issues

## Testing

Run the validation tests:

```bash
npm test -- config/__tests__/envValidator.test.js
```

## Security Notes

- Never commit `.env` file to version control
- Use different credentials for each environment
- Rotate secrets regularly
- Use strong, randomly generated secrets
- Store production secrets in secure secret management systems
