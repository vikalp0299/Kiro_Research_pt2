# Design Document

## Overview

The Class Registration App is a three-tier web application consisting of a React/Next.js frontend, Express.js backend API, and AWS DynamoDB database. The system implements secure authentication using JWT tokens and bcrypt password hashing, following OWASP security best practices. The application enables students to register accounts, log in securely, view available classes, enroll in courses, and manage their class registrations.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │         React/Next.js Frontend Application             │ │
│  │  - Login/Registration Pages                            │ │
│  │  - Class Management Interface                          │ │
│  │  - JWT Token Storage (httpOnly cookies)                │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS/TLS
                           │ REST API Calls
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Express.js Backend API                   │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Middleware Layer                                      │ │
│  │  - Authentication (JWT Verification)                   │ │
│  │  - Logging (Request/Response)                          │ │
│  │  - Rate Limiting                                       │ │
│  │  - Input Validation                                    │ │
│  │  - Error Handling                                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Router Layer                                          │ │
│  │  - /api/loginFunc (Authentication Routes)              │ │
│  │  - /api/classFunc (Class Management Routes)            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Controller Layer                                      │ │
│  │  - loginController.js (Auth Logic)                     │ │
│  │  - classController.js (Class Logic)                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────┬──────────────────────────────────┘
                           │ AWS SDK
                           │ DynamoDB Operations
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                      AWS DynamoDB                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  studentUserDB                                         │ │
│  │  - userId (PK), username, fullName, email, password    │ │
│  │  - GSI: EmailIndex, UsernameIndex                      │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  classDB                                               │ │
│  │  - classId (PK), className, credits, description       │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  classRegistrationDB                                   │ │
│  │  - classId (PK), userId (SK), className, regState      │ │
│  │  - GSI: UserIdIndex                                    │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- React 18+ (UI library)
- Next.js 15+ (Framework with App Router)
- HTML5/CSS3 (Markup and styling)
- Fetch API (HTTP client)

**Backend:**
- Node.js 18+ (Runtime)
- Express.js 4+ (Web framework)
- nodemon (Development server)
- bcrypt (Password hashing)
- jsonwebtoken (JWT authentication)
- helmet (Security headers)
- cors (CORS middleware)
- express-rate-limit (Rate limiting)

**Database:**
- AWS DynamoDB (NoSQL database)
- @aws-sdk/client-dynamodb (AWS SDK v3)
- @aws-sdk/lib-dynamodb (Document client)

**Testing:**
- Jest 29+ (Test runner)
- Supertest 6+ (API testing)
- React Testing Library 13+ (Component testing)

## Components and Interfaces

### Frontend Components

#### 1. Authentication Components

**LoginPage Component**
```typescript
interface LoginPageProps {}

interface LoginFormState {
  identifier: string; // username or email
  password: string;
  loading: boolean;
  error: string | null;
}

// Responsibilities:
// - Render login form with username/email and password fields
// - Validate input before submission
// - Call login API endpoint
// - Store JWT token on successful login
// - Redirect to class dashboard
// - Display error messages
```

**RegisterPage Component**
```typescript
interface RegisterPageProps {}

interface RegisterFormState {
  fullName: string;
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
  passwordStrength: 'weak' | 'medium' | 'strong';
  validationErrors: Record<string, string>;
  loading: boolean;
  error: string | null;
}

// Responsibilities:
// - Render registration form
// - Real-time password strength validation
// - Email format validation
// - Password policy enforcement
// - Call registration API endpoint
// - Store JWT token on successful registration
// - Redirect to class dashboard
```

#### 2. Class Management Components

**ClassDashboard Component**
```typescript
interface ClassDashboardProps {
  user: UserInfo;
}

interface ClassDashboardState {
  activeTab: 'available' | 'enrolled' | 'dropped';
}

// Responsibilities:
// - Render navigation tabs
// - Display appropriate class list based on active tab
// - Handle tab switching
// - Provide logout functionality
```

**ClassList Component**
```typescript
interface ClassListProps {
  classes: Class[];
  type: 'available' | 'enrolled' | 'dropped';
  onEnroll: (classId: string) => Promise<void>;
  onUnenroll: (classId: string) => Promise<void>;
  loading: boolean;
}

// Responsibilities:
// - Render list of classes
// - Display class details (ID, name, credits, description)
// - Show appropriate action buttons (enroll/unenroll/re-enroll)
// - Handle button click events
// - Display loading states
```

**ClassCard Component**
```typescript
interface ClassCardProps {
  class: Class;
  actionType: 'enroll' | 'unenroll' | 're-enroll';
  onAction: (classId: string) => Promise<void>;
  loading: boolean;
}

// Responsibilities:
// - Render individual class information
// - Display action button
// - Handle action button click
// - Show loading indicator during action
```

#### 3. Utility Components

**PasswordStrengthIndicator Component**
```typescript
interface PasswordStrengthIndicatorProps {
  password: string;
  onStrengthChange: (strength: 'weak' | 'medium' | 'strong') => void;
}

// Responsibilities:
// - Calculate password strength
// - Display visual strength indicator
// - Show password policy requirements
// - Provide real-time feedback
```

**LoadingSpinner Component**
```typescript
interface LoadingSpinnerProps {
  size?: 'small' | 'medium' | 'large';
  message?: string;
}

// Responsibilities:
// - Display loading animation
// - Show optional loading message
```

**ErrorMessage Component**
```typescript
interface ErrorMessageProps {
  message: string;
  onDismiss?: () => void;
}

// Responsibilities:
// - Display error message
// - Provide dismiss functionality
// - Auto-dismiss after timeout
```

### Backend Components

#### 1. Middleware

**auth.js - Authentication Middleware**
```typescript
interface AuthMiddleware {
  verifyToken(req: Request, res: Response, next: NextFunction): void;
  generateTokens(payload: TokenPayload): TokenPair;
  blacklistToken(token: string): Promise<void>;
  isTokenBlacklisted(token: string): Promise<boolean>;
}

interface TokenPayload {
  userId: number;
  username: string;
  email: string;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// Responsibilities:
// - Verify JWT tokens on protected routes
// - Extract and validate token from Authorization header
// - Check token against blacklist
// - Attach user info to request object
// - Generate access and refresh tokens
// - Manage token blacklist
```

**logger.js - Request Logging Middleware**
```typescript
interface LoggerMiddleware {
  logRequest(req: Request, res: Response, next: NextFunction): void;
  logAuthAttempt(username: string, success: boolean, ip: string): void;
  logError(error: Error, context: Record<string, any>): void;
}

// Responsibilities:
// - Log all incoming requests
// - Log response status and time
// - Color-code log output
// - Log authentication attempts
// - Log errors with context
// - Store logs in /BackEnd/Logs directory
```

**password.js - Password Utilities**
```typescript
interface PasswordUtilities {
  hashPassword(password: string): Promise<string>;
  comparePassword(password: string, hash: string): Promise<boolean>;
  validatePasswordStrength(password: string): PasswordValidation;
}

interface PasswordValidation {
  isValid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  errors: string[];
}

// Responsibilities:
// - Hash passwords with bcrypt (14 salt rounds)
// - Compare passwords securely
// - Validate password strength
// - Enforce password policy
```

#### 2. Controllers

**loginController.js**
```typescript
interface LoginController {
  registerStudentUser(req: Request, res: Response): Promise<void>;
  loginStudentUser(req: Request, res: Response): Promise<void>;
  logoutStudentUser(req: Request, res: Response): Promise<void>;
  refreshToken(req: Request, res: Response): Promise<void>;
}

// Responsibilities:
// - Handle user registration
// - Validate registration input
// - Check for existing users
// - Hash passwords
// - Generate JWT tokens
// - Handle user login
// - Verify credentials
// - Handle logout
// - Blacklist tokens
// - Refresh access tokens
```

**classController.js**
```typescript
interface ClassController {
  displayAllAvailableClasses(req: Request, res: Response): Promise<void>;
  getEnrolledClasses(req: Request, res: Response): Promise<void>;
  getDroppedClasses(req: Request, res: Response): Promise<void>;
  registerClass(req: Request, res: Response): Promise<void>;
  deregisterClass(req: Request, res: Response): Promise<void>;
}

// Responsibilities:
// - Fetch available classes for user
// - Fetch enrolled classes
// - Fetch dropped classes
// - Handle class enrollment
// - Handle class unenrollment
// - Validate class and user existence
// - Update registration status
```

#### 3. Database Layer

**database/userOperations.js**
```typescript
interface UserOperations {
  createDatabase(): Promise<void>;
  userExistsInDB(identifier: string): Promise<boolean>;
  getUserByIdentifier(identifier: string): Promise<User | null>;
  getUserById(userId: number): Promise<User | null>;
  pushUserData(userData: UserData): Promise<number>;
  generateUserId(): number;
}

interface UserData {
  username: string;
  fullName: string;
  email: string;
  password: string; // hashed
}

// Responsibilities:
// - Create studentUserDB table
// - Check user existence by username or email
// - Retrieve user data
// - Insert new user
// - Generate unique user IDs
```

**database/classOperations.js**
```typescript
interface ClassOperations {
  createClassDB(): Promise<void>;
  addDummyDataToClassDB(): Promise<void>;
  getAllClasses(): Promise<Class[]>;
  getClassById(classId: string): Promise<Class | null>;
}

interface Class {
  classId: string;
  className: string;
  credits: number;
  description: string;
}

// Responsibilities:
// - Create classDB table
// - Generate and insert dummy class data
// - Retrieve all classes
// - Retrieve class by ID
```

**database/registrationOperations.js**
```typescript
interface RegistrationOperations {
  createRegistrationDB(): Promise<void>;
  dispEnrolledClass(userId: number): Promise<ClassInfo[]>;
  dispAvailableClass(userId: number): Promise<ClassInfo[]>;
  dispDroppedClass(userId: number): Promise<ClassInfo[]>;
  pushRegistry(registration: Registration): Promise<void>;
  updateRegistry(classId: string, userId: number, status: string): Promise<void>;
  getRegistration(classId: string, userId: number): Promise<Registration | null>;
}

interface Registration {
  classId: string;
  userId: number;
  className: string;
  registrationState: 'enrolled' | 'dropped';
}

interface ClassInfo {
  classId: string;
  className: string;
}

// Responsibilities:
// - Create classRegistrationDB table
// - Fetch enrolled classes for user
// - Fetch available classes (excluding enrolled)
// - Fetch dropped classes for user
// - Create new registration
// - Update registration status
// - Check registration existence
```

## Data Models

### DynamoDB Table Schemas

#### studentUserDB

```typescript
{
  TableName: "studentUserDB",
  AttributeDefinitions: [
    { AttributeName: "userId", AttributeType: "N" },
    { AttributeName: "email", AttributeType: "S" },
    { AttributeName: "username", AttributeType: "S" }
  ],
  KeySchema: [
    { AttributeName: "userId", KeyType: "HASH" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "EmailIndex",
      KeySchema: [{ AttributeName: "email", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    },
    {
      IndexName: "UsernameIndex",
      KeySchema: [{ AttributeName: "username", KeyType: "HASH" }],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ],
  BillingMode: "PROVISIONED",
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
}

// Item Structure:
{
  userId: 1234567890,        // Number (10 digits)
  username: "johndoe",       // String
  fullName: "John Doe",      // String
  email: "john@example.com", // String
  password: "$2b$14$..."     // String (bcrypt hash)
}
```

#### classDB

```typescript
{
  TableName: "classDB",
  AttributeDefinitions: [
    { AttributeName: "classId", AttributeType: "S" }
  ],
  KeySchema: [
    { AttributeName: "classId", KeyType: "HASH" }
  ],
  BillingMode: "PROVISIONED",
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
}

// Item Structure:
{
  classId: "IFT 593",                    // String (e.g., "IFT 593", "CSE 201")
  className: "Advanced Computer Networks", // String
  credits: 4,                             // Number (3 or 4)
  description: "This course covers..."    // String
}
```

#### classRegistrationDB

```typescript
{
  TableName: "classRegistrationDB",
  AttributeDefinitions: [
    { AttributeName: "classId", AttributeType: "S" },
    { AttributeName: "userId", AttributeType: "N" }
  ],
  KeySchema: [
    { AttributeName: "classId", KeyType: "HASH" },
    { AttributeName: "userId", KeyType: "RANGE" }
  ],
  GlobalSecondaryIndexes: [
    {
      IndexName: "UserIdIndex",
      KeySchema: [
        { AttributeName: "userId", KeyType: "HASH" },
        { AttributeName: "classId", KeyType: "RANGE" }
      ],
      Projection: { ProjectionType: "ALL" },
      ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 }
    }
  ],
  BillingMode: "PROVISIONED",
  ProvisionedThroughput: {
    ReadCapacityUnits: 5,
    WriteCapacityUnits: 5
  }
}

// Item Structure:
{
  classId: "IFT 593",                    // String (Partition Key)
  userId: 1234567890,                    // Number (Sort Key)
  className: "Advanced Computer Networks", // String
  registrationState: "enrolled"          // String ("enrolled" or "dropped")
}
```

## Error Handling

### Error Response Format

```typescript
interface ErrorResponse {
  error: string;           // User-friendly error message
  code?: string;           // Error code for client handling
  details?: any;           // Additional error details (dev only)
  timestamp: string;       // ISO timestamp
  requestId?: string;      // Request tracking ID
}
```

### HTTP Status Codes

- **200 OK**: Successful GET, PUT, or DELETE
- **201 Created**: Successful POST (resource created)
- **204 No Content**: Successful DELETE with no response body
- **400 Bad Request**: Invalid input or validation error
- **401 Unauthorized**: Missing or invalid authentication
- **403 Forbidden**: Valid auth but insufficient permissions
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource conflict (e.g., duplicate user)
- **429 Too Many Requests**: Rate limit exceeded
- **500 Internal Server Error**: Server-side error

### Error Handling Strategy

1. **Input Validation Errors**: Return 400 with specific validation messages
2. **Authentication Errors**: Return 401 with generic message
3. **Authorization Errors**: Return 403 with generic message
4. **Not Found Errors**: Return 404 with resource type
5. **Conflict Errors**: Return 409 with conflict reason
6. **Server Errors**: Return 500 with generic message, log details
7. **Rate Limit Errors**: Return 429 with Retry-After header

### Centralized Error Handler

```typescript
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  // Log error with context
  logger.logError(err, {
    method: req.method,
    path: req.path,
    userId: req.user?.userId,
    ip: req.ip
  });

  // Determine status code
  const statusCode = err.statusCode || 500;

  // Build error response
  const errorResponse: ErrorResponse = {
    error: statusCode === 500 ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString(),
    requestId: req.id
  };

  // Add details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});
```

## Testing Strategy

### Unit Testing

**Backend Unit Tests**
- Test individual functions in controllers
- Test middleware functions
- Test database operations
- Test password hashing and comparison
- Test JWT token generation and verification
- Mock external dependencies (DynamoDB, bcrypt)

**Frontend Unit Tests**
- Test utility functions
- Test password validation logic
- Test form validation functions
- Test API client functions

### Integration Testing

**API Integration Tests**
- Test complete API endpoints with Supertest
- Test authentication flow (register, login, logout)
- Test class management endpoints
- Test error scenarios
- Test rate limiting
- Test middleware chain execution

**Database Integration Tests**
- Test database operations with test tables
- Test query performance
- Test transaction handling
- Clean up test data after each test

### Component Testing

**React Component Tests**
- Test component rendering
- Test user interactions (clicks, form submissions)
- Test state management
- Test API integration
- Test error handling
- Test loading states
- Use React Testing Library

### End-to-End Testing

**User Flow Tests**
- Test complete user registration flow
- Test login and authentication flow
- Test class enrollment workflow
- Test class unenrollment workflow
- Test navigation between pages
- Test error recovery

### Security Testing

**Authentication Tests**
- Test token expiration handling
- Test invalid token rejection
- Test token blacklisting
- Test rate limiting on auth endpoints
- Test password strength validation

**Authorization Tests**
- Test protected route access
- Test user can only access own data
- Test admin vs user permissions (if applicable)

**Input Validation Tests**
- Test SQL injection prevention
- Test XSS prevention
- Test CSRF protection
- Test input sanitization

### Test Coverage Goals

- Backend: 80%+ code coverage
- Frontend: 70%+ code coverage
- Critical paths: 100% coverage
- Security features: 100% coverage

### Testing Tools Configuration

**Jest Configuration**
```javascript
module.exports = {
  testEnvironment: 'node',
  coverageDirectory: 'coverage',
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.test.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**'
  ],
  testMatch: [
    '**/__tests__/**/*.(test|spec).{js,jsx,ts,tsx}',
    '**/*.(test|spec).{js,jsx,ts,tsx}'
  ],
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js']
};
```

## Security Considerations

### Authentication Security

1. **Password Security**
   - Bcrypt with 14 salt rounds
   - Minimum 12 characters
   - Complexity requirements enforced
   - Password history tracking
   - Secure password reset flow

2. **JWT Token Security**
   - 256-bit secret stored in environment variables
   - Short-lived access tokens (30 minutes)
   - Long-lived refresh tokens (7 days)
   - Token rotation on refresh
   - Token blacklisting on logout
   - Signature verification on every request

3. **Session Management**
   - 30-minute inactivity timeout
   - Rate limiting (5 attempts per 15 minutes)
   - Account lockout after repeated failures
   - Session invalidation on password change

### API Security

1. **Rate Limiting**
   - Global: 100 requests per 15 minutes
   - Auth endpoints: 5 attempts per 15 minutes
   - Per-IP and per-user limits

2. **Input Validation**
   - Server-side validation for all inputs
   - Type checking and sanitization
   - Parameterized database queries
   - XSS prevention through escaping

3. **Security Headers**
   - Content-Security-Policy
   - X-Content-Type-Options: nosniff
   - X-Frame-Options: DENY
   - Strict-Transport-Security
   - X-XSS-Protection

4. **CORS Configuration**
   - Specific allowed origins (no wildcards)
   - Credentials support
   - Limited HTTP methods

### Database Security

1. **Access Control**
   - IAM roles with least privilege
   - Separate credentials per environment
   - VPC security groups
   - Encryption at rest
   - Encryption in transit (TLS)

2. **Query Security**
   - Parameterized queries only
   - Input validation before queries
   - Query result size limits
   - Pagination for large datasets

### Client-Side Security

1. **Token Storage**
   - Prefer httpOnly cookies
   - Secure flag enabled
   - SameSite attribute set
   - Clear on logout

2. **Input Handling**
   - Client-side validation
   - Sanitization before rendering
   - CSP headers to prevent XSS

### Monitoring and Logging

1. **Security Logging**
   - All authentication attempts
   - Authorization failures
   - Suspicious activities
   - Rate limit violations
   - Error events

2. **Log Management**
   - Structured JSON format
   - No sensitive data in logs
   - Log rotation
   - Secure storage
   - Retention policies

## Deployment Considerations

### Environment Variables

Required environment variables:
```
# JWT Configuration
JWT_SECRET=<256-bit-random-secret>
JWT_EXPIRES_IN=30m
JWT_REFRESH_EXPIRES_IN=7d

# AWS Configuration
AWS_ACCESS_KEY_ID=<aws-access-key>
AWS_SECRET_ACCESS_KEY=<aws-secret-key>
AWS_REGION=us-east-1

# Application Configuration
NODE_ENV=production
PORT=3000
FRONTEND_URL=https://yourdomain.com

# Security Configuration
BCRYPT_SALT_ROUNDS=14
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5

# CORS Configuration
ALLOWED_ORIGINS=https://yourdomain.com
```

### Production Checklist

- [ ] All environment variables configured
- [ ] HTTPS/TLS enabled
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured
- [ ] Error handling tested
- [ ] Database backups enabled
- [ ] Monitoring and alerting set up
- [ ] npm audit passed
- [ ] Security testing completed
- [ ] Performance testing completed
- [ ] Documentation updated

## Performance Optimization

### Backend Optimization

1. **Caching Strategy**
   - Cache class list data (5-minute TTL)
   - Cache user data after authentication
   - Use Redis for session storage (optional)

2. **Database Optimization**
   - Use GSI for efficient queries
   - Implement pagination
   - Batch operations where possible
   - Connection pooling

3. **API Optimization**
   - Compression middleware
   - Response caching headers
   - Minimize payload size
   - Async/await for non-blocking operations

### Frontend Optimization

1. **Code Splitting**
   - Route-based code splitting
   - Lazy load components
   - Dynamic imports for heavy libraries

2. **Asset Optimization**
   - Image optimization
   - CSS minification
   - JavaScript bundling
   - Tree shaking

3. **Rendering Optimization**
   - React.memo for expensive components
   - useMemo and useCallback hooks
   - Virtual scrolling for long lists
   - Debounce user inputs

## Scalability Considerations

### Horizontal Scaling

- Stateless backend design
- Load balancer for multiple instances
- Session storage in external cache
- Database read replicas

### Vertical Scaling

- Increase DynamoDB capacity
- Optimize database queries
- Increase server resources
- CDN for static assets

### Future Enhancements

- Microservices architecture
- Event-driven architecture
- GraphQL API
- Real-time updates with WebSockets
- Advanced caching with Redis
- Full-text search with Elasticsearch
