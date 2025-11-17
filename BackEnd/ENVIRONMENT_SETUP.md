# Environment Setup Guide

This guide explains how to set up and validate environment variables for the Class Registration App backend.

## Quick Start

### Option 1: Interactive Setup (Recommended)

Run the interactive setup script to create your `.env` file:

```bash
cd BackEnd
python3 envSetter.py
```

The script will:
- ✅ Generate a secure 256-bit JWT secret automatically
- ✅ Prompt for all required configuration values
- ✅ Validate inputs in real-time
- ✅ Create a properly formatted `.env` file
- ✅ Provide helpful defaults for common settings

### Option 2: Manual Setup

1. Copy the example file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and fill in all required values

3. Ensure all values meet validation requirements (see below)

## Environment Validation

The server automatically validates all environment variables on startup. If any validation fails, the server will:

1. Display detailed error messages
2. Exit immediately (preventing startup with invalid config)
3. Suggest running `envSetter.py` to fix issues

### Validation Rules

#### JWT Configuration
- `JWT_SECRET`: Minimum 32 characters (256 bits recommended)
- `JWT_EXPIRES_IN`: Format: `<number><unit>` (e.g., "30m", "1h", "7d")
- `JWT_REFRESH_EXPIRES_IN`: Format: `<number><unit>` (e.g., "7d", "30d")
- `JWT_ISSUER`: Non-empty string
- `JWT_AUDIENCE`: Non-empty string

#### AWS Configuration
- `AWS_ACCESS_KEY_ID`: Non-empty string
- `AWS_SECRET_ACCESS_KEY`: Non-empty string
- `AWS_REGION`: Valid AWS region format (e.g., "us-east-1", "eu-west-2")

#### Application Configuration
- `NODE_ENV`: Must be "development", "production", or "test"
- `PORT`: Valid port number (1-65535)
- `FRONTEND_URL`: Valid URL starting with http:// or https://

#### Security Configuration
- `BCRYPT_SALT_ROUNDS`: Number between 10-20 (14 recommended for production)
- `RATE_LIMIT_WINDOW_MS`: Positive number (milliseconds)
- `RATE_LIMIT_MAX_REQUESTS`: Positive number
- `AUTH_RATE_LIMIT_MAX`: Positive number

#### CORS Configuration
- `ALLOWED_ORIGINS`: Comma-separated list of valid URLs

#### Database Configuration (Optional)
- `DYNAMODB_ENDPOINT`: Valid URL (only needed for local development)

## Security Best Practices

### JWT Secret Generation
The `envSetter.py` script automatically generates a cryptographically secure 256-bit secret using Python's `secrets` module. This is the recommended approach.

If generating manually, use:
```bash
# Generate 256-bit secret (32 bytes in hex)
openssl rand -hex 32
```

### Bcrypt Salt Rounds
- **Development**: 12 rounds (faster, acceptable for testing)
- **Production**: 14 rounds (recommended balance of security and performance)
- **High Security**: 16+ rounds (slower but more secure)

Higher rounds = exponentially more secure but slower hashing.

### Rate Limiting
Default settings:
- **Global endpoints**: 100 requests per 15 minutes
- **Auth endpoints**: 5 attempts per 15 minutes

Adjust based on your traffic patterns and security requirements.

### CORS Origins
- **Development**: `http://localhost:3001,http://localhost:3000`
- **Production**: Only your actual frontend domain(s)
- **Never use wildcards** (`*`) in production

## Integration with Server

Add to your `server.js` or main entry point:

```javascript
// Load environment variables FIRST
require('dotenv').config();

// Validate environment on startup
const { validateOnStartup, getConfig } = require('./config/envValidator');
validateOnStartup();

// Get validated configuration
const config = getConfig();

// Use configuration throughout your app
const app = express();
app.listen(config.app.port, () => {
  console.log(`Server running on port ${config.app.port}`);
});
```

## Troubleshooting

### Error: ".env file not found"
**Solution**: Run `python3 envSetter.py` or copy `.env.example` to `.env`

### Error: "JWT_SECRET must be at least 32 characters"
**Solution**: Generate a new secret with `openssl rand -hex 32` or run `envSetter.py`

### Error: "AWS_REGION must be a valid AWS region"
**Solution**: Use format like "us-east-1", "eu-west-2", etc.

### Error: "BCRYPT_SALT_ROUNDS must be between 10 and 20"
**Solution**: Set to 14 (recommended) or any value between 10-20

### Error: "ALLOWED_ORIGINS must be comma-separated valid URLs"
**Solution**: Ensure all origins start with http:// or https://

## Testing

Run environment validation tests:

```bash
npm test -- config/__tests__/envValidator.test.js
```

## Files

- `envSetter.py` - Interactive setup script
- `config/envValidator.js` - Validation module
- `config/__tests__/envValidator.test.js` - Unit tests
- `.env.example` - Example configuration
- `.env` - Your actual configuration (never commit!)

## Next Steps

After setting up your environment:

1. ✅ Verify `.env` is in `.gitignore`
2. ✅ Run `npm test` to verify validation works
3. ✅ Start the server with `npm start` or `npm run dev`
4. ✅ Check that validation passes on startup

## Security Reminders

- ⚠️ **Never commit `.env` to version control**
- ⚠️ **Use different credentials for each environment**
- ⚠️ **Rotate secrets regularly**
- ⚠️ **Use strong, randomly generated secrets**
- ⚠️ **Store production secrets in secure secret management systems** (AWS Secrets Manager, HashiCorp Vault, etc.)
