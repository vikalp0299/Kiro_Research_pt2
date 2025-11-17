# Class Registration App

A full-stack web application for managing student class registrations, built with Express.js backend and Next.js frontend.

## Features

- **User Authentication**: Secure registration and login with JWT tokens
- **Password Security**: Bcrypt hashing with configurable salt rounds (14 recommended)
- **Class Management**: Browse, enroll, and unenroll from available classes
- **Registration Tracking**: View enrolled and dropped classes
- **Security**: Helmet.js security headers, CORS, rate limiting, and comprehensive input validation
- **Logging**: Structured logging for requests, authentication attempts, and errors
- **Database**: AWS DynamoDB for scalable data storage

## Project Structure

```
/
├── BackEnd/                 # Express.js API server
│   ├── Controller/          # Business logic and request handlers
│   ├── Router/              # Route definitions
│   ├── Middleware/          # Authentication, logging, security, rate limiting
│   ├── database/            # DynamoDB operations
│   ├── config/              # Environment validation
│   ├── Logs/                # Application logs
│   └── __tests__/           # Backend tests
│
├── FrontEnd/                # Next.js frontend application
│   ├── app/                 # Next.js App Router pages
│   ├── components/          # Reusable React components
│   ├── context/             # React context providers
│   ├── lib/                 # API client utilities
│   ├── js/utils/            # Utility functions
│   └── CSS/                 # Stylesheets
│
└── .kiro/                   # Project specifications and steering rules
```

## Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Authentication**: JSON Web Tokens (JWT)
- **Password Hashing**: Bcrypt
- **Database**: AWS DynamoDB
- **Security**: Helmet.js, CORS, express-rate-limit
- **Testing**: Jest, Supertest

### Frontend
- **Framework**: Next.js 15+ (App Router)
- **UI Library**: React 19+
- **Styling**: CSS3 with CSS variables
- **HTTP Client**: Native Fetch API
- **Testing**: Jest, React Testing Library

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- AWS Account with DynamoDB access
- Python 3 (for environment setup script)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd BackEnd
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
python3 envSetter.py
```

Or manually create `.env` file based on `.env.example`:
```bash
cp .env.example .env
# Edit .env with your configuration
```

4. Start the development server:
```bash
npm run dev
```

The backend API will be available at `http://localhost:3000`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd FrontEnd
```

2. Install dependencies:
```bash
npm install
```

3. Create environment file:
```bash
cp .env.example .env.local
# Edit .env.local if needed
```

4. Start the development server:
```bash
npm run dev
```

The frontend will be available at `http://localhost:3001`

## Environment Variables

### Backend (.env)

```bash
# JWT Configuration
JWT_SECRET=your-256-bit-secret-here
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d
JWT_ISSUER=class-registration-app
JWT_AUDIENCE=class-registration-users

# AWS Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
AWS_REGION=us-east-1

# Application Configuration
NODE_ENV=development
PORT=3000
FRONTEND_URL=http://localhost:3001

# Security Configuration
BCRYPT_SALT_ROUNDS=14
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000
```

### Frontend (.env.local)

```bash
NEXT_PUBLIC_API_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=Class Registration App
```

## API Endpoints

### Authentication

- `POST /api/loginFunc/register` - Register new user
- `POST /api/loginFunc/login` - Login user
- `POST /api/loginFunc/logout` - Logout user (requires authentication)

### Class Management

All class endpoints require authentication (JWT token in Authorization header).

- `GET /api/classFunc/available` - Get available classes
- `GET /api/classFunc/enrolled` - Get enrolled classes
- `GET /api/classFunc/dropped` - Get dropped classes
- `POST /api/classFunc/enroll` - Enroll in a class
- `POST /api/classFunc/unenroll` - Unenroll from a class

### Health Check

- `GET /health` - Server health check

## Testing

### Backend Tests

Run all tests with coverage:
```bash
cd BackEnd
npm test
```

Run specific test suites:
```bash
npm test -- Controller/__tests__/loginController.test.js
npm test -- Middleware/__tests__/auth.test.js
npm test -- database/__tests__/userOperations.test.js
```

### Frontend Tests

Run all tests:
```bash
cd FrontEnd
npm test
```

Run tests in watch mode:
```bash
npm test -- --watch
```

## Security Features

- **Password Policy**: Minimum 12 characters, uppercase, lowercase, numbers, special characters
- **JWT Tokens**: Secure token-based authentication with configurable expiration
- **Rate Limiting**: Global (100 req/15min) and auth-specific (5 req/15min) limits
- **Security Headers**: Helmet.js with CSP, HSTS, X-Frame-Options, etc.
- **CORS**: Configurable allowed origins
- **Input Validation**: Comprehensive server-side validation
- **Password Hashing**: Bcrypt with 14 salt rounds
- **Token Blacklisting**: Logout invalidates tokens

## Database Schema

### studentUserDB Table
- **Primary Key**: userId (Number)
- **Attributes**: username, fullName, email, password (hashed)
- **GSI**: EmailIndex, UsernameIndex

### classDB Table
- **Primary Key**: classId (String)
- **Attributes**: className, credits, description

### classRegistrationDB Table
- **Composite Primary Key**: classId (HASH), userId (RANGE)
- **Attributes**: className, registrationState ('enrolled' or 'dropped')
- **GSI**: UserIdIndex

## Development

### Backend Development

```bash
cd BackEnd
npm run dev  # Starts nodemon for auto-reload
```

### Frontend Development

```bash
cd FrontEnd
npm run dev  # Starts Next.js dev server
```

### Code Quality

- Follow ESLint rules
- Write tests for new features
- Maintain test coverage above 80%
- Document complex logic with comments
- Use meaningful variable and function names

## Deployment

### Backend Deployment

1. Set `NODE_ENV=production` in environment
2. Use strong JWT secrets (256-bit minimum)
3. Configure production database credentials
4. Set up proper CORS origins
5. Enable HTTPS/TLS
6. Configure production logging
7. Set up monitoring and alerts

### Frontend Deployment

1. Build the production bundle:
```bash
npm run build
```

2. Start the production server:
```bash
npm start
```

3. Configure environment variables for production
4. Set up CDN for static assets
5. Enable caching strategies

## Troubleshooting

### Backend Issues

**Database Connection Errors**
- Verify AWS credentials are correct
- Check AWS region configuration
- Ensure DynamoDB tables exist
- Verify IAM permissions

**Authentication Failures**
- Check JWT_SECRET is set and consistent
- Verify token expiration settings
- Check CORS configuration
- Ensure rate limits aren't exceeded

**Environment Variable Errors**
- Run `python3 envSetter.py` to reconfigure
- Verify all required variables are set
- Check `.env` file exists and is not in `.gitignore`

### Frontend Issues

**API Connection Errors**
- Verify `NEXT_PUBLIC_API_URL` is correct
- Check backend server is running
- Verify CORS settings allow frontend origin
- Check browser console for errors

**Authentication Issues**
- Clear browser localStorage
- Check token is being stored correctly
- Verify API endpoints are accessible
- Check network tab for failed requests

## Contributing

1. Fork the repository
2. Create a feature branch
3. Write tests for new features
4. Ensure all tests pass
5. Submit a pull request

## License

ISC

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Check application logs in `BackEnd/Logs/`
- Verify environment configuration

## Acknowledgments

- Built with Express.js and Next.js
- Uses AWS DynamoDB for data storage
- Implements OWASP security best practices
- Follows RESTful API design principles
