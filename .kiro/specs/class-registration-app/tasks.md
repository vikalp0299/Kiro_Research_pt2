# Implementation Plan

## Backend Implementation

- [x] 1. Set up backend project structure and core dependencies
  - Create /BackEnd directory with subdirectories: /Controller, /Router, /Middleware, /database, /Logs
  - Initialize package.json with required dependencies: express, bcrypt, jsonwebtoken, @aws-sdk/client-dynamodb, @aws-sdk/lib-dynamodb, helmet, cors, express-rate-limit, dotenv
  - Create .env.example file documenting all required environment variables
  - Create .gitignore to exclude node_modules, .env, and /Logs
  - _Requirements: 17.1, 17.2, 17.5_

- [x] 2. Implement environment configuration and validation
  - Create envSetter.py script to interactively collect and create .env file
  - Implement environment variable validation on server startup
  - Configure JWT_SECRET (256-bit), AWS credentials, bcrypt salt rounds (14), rate limiting settings
  - _Requirements: 17.1, 17.4, 17.6, 17.7, 5.1, 5.2_

- [x] 3. Implement database initialization and table creation
  - Create database/dynamoClient.js to initialize DynamoDB client with proper configuration
  - Create database/userOperations.js with createDatabase() function for studentUserDB table
  - Implement Global Secondary Indexes for email and username lookups
  - Create database/classOperations.js with createClassDB() function
  - Create database/registrationOperations.js with createRegistrationDB() function
  - Implement composite key (classId, userId) and UserIdIndex GSI
  - _Requirements: 2.1, 20.1, 20.2, 20.3, 20.4_

- [x] 4. Implement dummy class data generation
  - Create addDummyDataToClassDB() function in database/classOperations.js
  - Generate 5-10 classes with random IFT, CSE, CCE, or EEE course codes
  - Include classId, className, credits (3 or 4), and description for each class
  - _Requirements: 2.2_

- [x] 5. Implement password security utilities
  - Create Middleware/password.js with hashPassword() function using bcrypt with 14 salt rounds
  - Implement comparePassword() function for secure password comparison
  - Create validatePasswordStrength() function enforcing minimum 12 characters, uppercase, lowercase, numbers, special characters
  - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 1.2_
- [x] 5.1 Write unit tests for password utilities
  - Test password hashing produces different hashes for same password
  - Test password comparison with correct and incorrect passwords
  - Test password strength validation with various password combinations
  - _Requirements: 4.1, 4.2, 4.3_

- [x] 6. Implement JWT token management
  - Create Middleware/auth.js with generateTokens() function
  - Implement access token generation with 30-minute expiration
  - Implement refresh token generation with 7-day expiration
  - Include issuer, audience, userId, username, and email claims
  - Create token blacklist storage mechanism (in-memory Set or DynamoDB table)
  - Implement blacklistToken() and isTokenBlacklisted() functions
  - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.7, 1.4, 1.7_
- [x] 6.1 Write unit tests for JWT token management
  - Test token generation includes all required claims
  - Test token expiration times are set correctly
  - Test token blacklisting and blacklist checking
  - Test token verification with valid and invalid tokens
  - _Requirements: 5.3, 5.4, 5.6, 5.7_

- [x] 7. Implement authentication middleware
  - Create verifyToken() middleware in Middleware/auth.js
  - Extract token from Authorization header
  - Verify token signature, expiration, issuer, and audience
  - Check token against blacklist
  - Attach decoded user info to req.user
  - Return 401 for invalid/expired tokens
  - _Requirements: 5.6, 9.1, 9.2, 9.3, 19.8_

- [x] 8. Implement request logging middleware
  - Create Middleware/logger.js with logRequest() function
  - Log request method, path, IP address, status code, and response time
  - Implement color-coded console output
  - Create logAuthAttempt() function for authentication events
  - Create logError() function with context
  - Store logs in /BackEnd/Logs directory with structured JSON format
  - _Requirements: 19.2, 14.1, 14.2, 14.3, 14.4, 14.5, 14.7, 14.8_

- [x] 9. Implement rate limiting middleware
  - Configure express-rate-limit for global endpoints (100 requests per 15 minutes)
  - Create stricter rate limiter for authentication endpoints (5 attempts per 15 minutes)
  - Return 429 with Retry-After header when limit exceeded
  - _Requirements: 8.1, 8.2, 1.6_

- [x] 10. Implement security headers and CORS
  - Configure helmet.js with all recommended security headers
  - Set Content-Security-Policy, X-Content-Type-Options, X-Frame-Options, Strict-Transport-Security
  - Configure CORS with specific allowed origins from environment variables
  - Enable credentials support
  - _Requirements: 8.3, 8.4, 8.8, 8.9_

- [x] 11. Implement user database operations
  - Create userExistsInDB() function to check username or email existence
  - Implement getUserByIdentifier() to retrieve user by username or email using GSI
  - Create getUserById() function
  - Implement pushUserData() to insert new user with hashed password
  - Create generateUserId() function to generate unique 10-digit user IDs
  - _Requirements: 1.3, 20.5, 20.6_

- [x] 12. Implement user registration controller
  - Create Controller/loginController.js with registerStudentUser() function
  - Validate input format (username, fullName, email, password)
  - Validate password strength and complexity
  - Check for existing username or email
  - Hash password with bcrypt
  - Generate unique userId
  - Store user in database
  - Generate JWT tokens
  - Return tokens and user info
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 19.4_
- [x] 12.1 Write integration tests for user registration
  - Test successful registration with valid data
  - Test registration with weak password
  - Test registration with existing username
  - Test registration with existing email
  - Test registration with invalid email format
  - Verify JWT token is returned on success
  - _Requirements: 1.1, 1.2, 1.3, 1.4, 21.4_

- [x] 13. Implement user login controller
  - Create loginStudentUser() function in Controller/loginController.js
  - Validate input (username/email and password)
  - Retrieve user from database
  - Compare password with stored hash using bcrypt
  - Generate JWT tokens on successful authentication
  - Log authentication attempt
  - Return generic error message on failure to prevent enumeration
  - _Requirements: 1.5, 9.8, 19.4_
- [x] 13.1 Write integration tests for user login
  - Test successful login with valid username and password
  - Test successful login with valid email and password
  - Test login with incorrect password
  - Test login with non-existent username
  - Verify JWT token is returned on success
  - Verify generic error message on failure
  - _Requirements: 1.5, 9.8, 21.4_

- [x] 14. Implement logout controller
  - Create logoutStudentUser() function in Controller/loginController.js
  - Extract token from request
  - Add token to blacklist
  - Clear authentication data
  - Return success response
  - _Requirements: 1.7, 6.2_
- [x] 14.1 Write integration tests for logout
  - Test successful logout with valid token
  - Test logout without token
  - Verify token is blacklisted after logout
  - Verify blacklisted token cannot access protected routes
  - _Requirements: 1.7, 5.7, 21.4_

- [x] 15. Implement class query operations
  - Create getAllClasses() function in database/classOperations.js
  - Implement getClassById() function
  - Create dispEnrolledClass() in database/registrationOperations.js to fetch enrolled classes
  - Implement dispAvailableClass() to fetch classes excluding enrolled ones
  - Create dispDroppedClass() to fetch dropped classes
  - _Requirements: 2.3, 2.4, 2.5, 2.6_

- [x] 16. Implement class display controllers
  - Create Controller/classController.js with displayAllAvailableClasses() function
  - Implement getEnrolledClasses() function
  - Create getDroppedClasses() function
  - Extract userId from req.user (JWT payload)
  - Return class data with classId, className, credits, description
  - _Requirements: 2.3, 2.4, 2.5, 2.6, 19.5_

- [x] 17. Implement class registration operations
  - Create getRegistration() function in database/registrationOperations.js
  - Implement pushRegistry() to create new registration record
  - Create updateRegistry() to update registration status
  - Validate classId and userId before operations
  - _Requirements: 3.1, 3.3, 20.6_

- [x] 18. Implement class enrollment controller
  - Create registerClass() function in Controller/classController.js
  - Validate classId and userId
  - Check if class exists
  - Check if already enrolled
  - Check if previously dropped (update status to "enrolled")
  - Create or update registration record
  - Return success response
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 19.6_
- [x] 18.1 Write integration tests for class enrollment
  - Test successful enrollment in available class
  - Test re-enrollment in previously dropped class
  - Test enrollment in already enrolled class (should fail)
  - Test enrollment in non-existent class
  - Test enrollment without authentication token
  - _Requirements: 3.1, 3.2, 3.3, 3.5, 21.5_

- [-] 19. Implement class unenrollment controller
  - Create deregisterClass() function in Controller/classController.js
  - Validate classId and userId
  - Check if currently enrolled
  - Update registration status to "dropped"
  - Return success response
  - _Requirements: 3.4, 3.6, 19.6_
- [x] 19.1 Write integration tests for class unenrollment
  - Test successful unenrollment from enrolled class
  - Test unenrollment from non-enrolled class (should fail)
  - Test unenrollment from non-existent class
  - Test unenrollment without authentication token
  - _Requirements: 3.4, 3.6, 21.5_

- [x] 20. Implement authentication routes
  - Create Router/loginRoutes.js
  - Define POST /api/loginFunc/register route
  - Define POST /api/loginFunc/login route with stricter rate limiting
  - Define POST /api/loginFunc/logout route with authentication middleware
  - Mount router in main server file
  - _Requirements: 19.3, 19.4_

- [x] 21. Implement class management routes
  - Create Router/classRoutes.js
  - Apply authentication middleware to all routes
  - Define GET /api/classFunc/available route
  - Define GET /api/classFunc/enrolled route
  - Define GET /api/classFunc/dropped route
  - Define POST /api/classFunc/enroll route
  - Define POST /api/classFunc/unenroll route
  - Mount router in main server file
  - _Requirements: 19.3, 19.5, 19.6_

- [x] 22. Implement centralized error handling
  - Create error handling middleware in main server file
  - Handle different error types (validation, authentication, authorization, not found, server)
  - Return appropriate HTTP status codes
  - Never expose stack traces in production
  - Log detailed errors server-side only
  - Return generic error messages to clients
  - _Requirements: 16.1, 16.2, 16.3, 16.4, 16.5, 16.6, 16.7, 19.7_

- [x] 23. Create main Express server file
  - Create server.js or index.js in /BackEnd
  - Initialize Express app
  - Load environment variables
  - Initialize database tables on startup
  - Apply middleware in correct order: logging, helmet, CORS, rate limiting, body parser
  - Mount routers
  - Apply error handling middleware
  - Start server on configured port
  - _Requirements: 19.1_

## Frontend Implementation

- [x] 24. Set up frontend project structure
  - Create /FrontEnd directory with subdirectories: /js, /CSS, /HTML
  - Initialize Next.js project with App Router
  - Install dependencies: react, next
  - Configure next.config.js with API proxy settings
  - Create .env.local for frontend environment variables
  - _Requirements: 18.1_

- [x] 25. Create authentication API client utilities
  - Create /FrontEnd/js/api/authApi.js
  - Implement registerUser() function with fetch API
  - Create loginUser() function
  - Implement logoutUser() function
  - Add proper error handling and response parsing
  - Include Authorization header with JWT token
  - _Requirements: 18.1, 18.2_

- [x] 26. Create class management API client utilities
  - Create /FrontEnd/js/api/classApi.js
  - Implement getAvailableClasses() function
  - Create getEnrolledClasses() function
  - Implement getDroppedClasses() function
  - Create enrollInClass() function
  - Implement unenrollFromClass() function
  - Include authentication token in all requests
  - _Requirements: 18.5, 18.6, 18.7_

- [x] 27. Implement password validation utilities
  - Create /FrontEnd/js/utils/passwordValidation.js
  - Implement validatePassword() function checking minimum 12 characters
  - Check for uppercase, lowercase, numbers, special characters
  - Calculate password strength (weak, medium, strong)
  - Return validation feedback messages
  - _Requirements: 1.2, 18.3_
- [x] 27.1 Write unit tests for password validation
  - Test validation with weak passwords
  - Test validation with medium strength passwords
  - Test validation with strong passwords
  - Test each password requirement individually
  - _Requirements: 1.2, 21.3_

- [x] 28. Create PasswordStrengthIndicator component
  - Create /FrontEnd/components/PasswordStrengthIndicator.jsx
  - Display visual strength indicator (color-coded bar)
  - Show password policy requirements checklist
  - Provide real-time feedback as user types
  - _Requirements: 18.3_

- [x] 29. Create LoadingSpinner component
  - Create /FrontEnd/components/LoadingSpinner.jsx
  - Implement configurable size (small, medium, large)
  - Support optional loading message
  - _Requirements: 18.8_

- [x] 30. Create ErrorMessage component
  - Create /FrontEnd/components/ErrorMessage.jsx
  - Display user-friendly error messages
  - Implement dismiss functionality
  - Add auto-dismiss after timeout
  - _Requirements: 18.9_

- [x] 31. Implement registration page
  - Create /FrontEnd/app/register/page.jsx
  - Create registration form with fullName, email, username, password, confirmPassword fields
  - Implement form state management with useState
  - Add real-time password strength validation
  - Validate email format with regex
  - Check password confirmation match
  - Call registerUser API on form submission
  - Store JWT token on successful registration
  - Redirect to class dashboard
  - Display loading state during submission
  - Show error messages for validation or API errors
  - _Requirements: 18.2, 18.3, 1.1, 1.2_
- [x] 31.1 Write component tests for registration page
  - Test form renders with all required fields
  - Test password strength indicator updates in real-time
  - Test form validation before submission
  - Test successful registration flow
  - Test error handling for API failures
  - _Requirements: 18.2, 18.3, 21.6_

- [x] 32. Implement login page
  - Create /FrontEnd/app/login/page.jsx
  - Create login form with username/email and password fields
  - Implement form validation
  - Call loginUser API on form submission
  - Store JWT token on successful login
  - Redirect to class dashboard
  - Display loading state during submission
  - Show error messages for invalid credentials
  - Add link to registration page
  - _Requirements: 18.1, 1.5_
- [x] 32.1 Write component tests for login page
  - Test form renders with required fields
  - Test form validation
  - Test successful login flow
  - Test error handling for invalid credentials
  - Test navigation to registration page
  - _Requirements: 18.1, 21.6_

- [x] 33. Create ClassCard component
  - Create /FrontEnd/js/components/ClassCard.jsx
  - Display class information (classId, className, credits, description)
  - Show appropriate action button based on type (enroll, unenroll, re-enroll)
  - Handle button click events
  - Display loading indicator during action
  - _Requirements: 18.5, 18.6, 18.7_

- [x] 34. Create ClassList component
  - Create /FrontEnd/js/components/ClassList.jsx
  - Render list of ClassCard components
  - Handle enroll and unenroll actions
  - Pass loading state to child components
  - Display empty state when no classes available
  - _Requirements: 18.5, 18.6, 18.7_

- [x] 35. Implement class dashboard page
  - Create /FrontEnd/app/dashboard/page.jsx
  - Implement tab navigation (Available Classes, My Classes, Dropped Classes)
  - Manage active tab state
  - Fetch appropriate class data based on active tab
  - Display ClassList component with fetched data
  - Implement logout functionality
  - Add loading states for data fetching
  - Handle API errors gracefully
  - Protect route with authentication check
  - _Requirements: 18.4, 18.5, 18.6, 18.7_
- [x] 35.1 Write component tests for class dashboard
  - Test tab navigation switches between views
  - Test data fetching for each tab
  - Test enrollment and unenrollment actions
  - Test logout functionality
  - Test loading and error states
  - Test authentication protection
  - _Requirements: 18.4, 18.5, 18.6, 18.7, 21.6_

- [x] 36. Implement token storage and management
  - Create /FrontEnd/js/utils/tokenStorage.js
  - Implement functions to store, retrieve, and clear JWT tokens
  - Use httpOnly cookies if possible, otherwise localStorage with security measures
  - Add token expiration checking
  - Implement automatic token refresh logic
  - _Requirements: 12.1, 12.2, 12.3_

- [x] 37. Create authentication context and protected routes
  - Create /FrontEnd/context/AuthContext.jsx
  - Implement authentication state management
  - Create useAuth hook for accessing auth state
  - Implement route protection logic
  - Redirect unauthenticated users to login page
  - _Requirements: 12.8_
- [x] 37.1 Write tests for authentication context
  - Test useAuth hook throws error outside provider
  - Test authentication state initialization
  - Test login and register functions
  - Test logout functionality
  - Test token expiration handling
  - _Requirements: 12.8, 21.6_

- [x] 38. Implement CSS styling
  - Enhanced /FrontEnd/CSS/globals.css with CSS variables and comprehensive base styles
  - Implemented responsive design with mobile-first approach
  - Added CSS variables for consistent theming (colors, spacing, typography)
  - Ensured accessibility with proper focus states and color contrast
  - Added utility classes for common patterns
  - Implemented smooth transitions and animations
  - Added scrollbar styling and selection colors
  - Supported prefers-reduced-motion for accessibility
  - Note: Component-specific styles use styled-jsx inline in components
  - _Requirements: 18.1_

## Testing and Documentation

- [x] 39. Write security and middleware tests
  - ✅ Security middleware tests already exist (helmet, CORS)
  - ✅ Authentication middleware tests already exist (JWT verification, blacklisting)
  - ✅ Password middleware tests already exist (hashing, comparison, validation)
  - ✅ Logger middleware tests already exist (request logging, auth logging, error logging)
  - ✅ Created rate limiting middleware tests (global and auth limiters)
  - ✅ Created error handling middleware tests (custom error classes, asyncHandler)
  - All middleware tests passing with good coverage
  - _Requirements: 9.1, 9.2, 8.1, 8.2, 21.4_

- [x] 40. Write database operation tests
  - ✅ Created userOperations.test.js with 20 tests
  - ✅ Created classOperations.test.js with 13 tests
  - ✅ Created registrationOperations.test.js with 20 tests
  - ✅ Mocked DynamoDB client properly
  - ✅ Tested create, retrieve, update operations
  - ✅ Tested error scenarios and validation
  - All 53 tests passing with 80% coverage
  - _Requirements: 20.5, 20.6, 21.4_

- [x] 41. Write end-to-end API workflow tests
  - Create /BackEnd/__tests__/e2e.test.js
  - Test complete user registration and login flow
  - Test complete class enrollment workflow
  - Test complete class unenrollment and re-enrollment workflow
  - Use Supertest for HTTP endpoint testing
  - _Requirements: 21.4, 21.5_

- [x] 42. Create README documentation
  - Document project structure and architecture
  - Provide setup instructions for backend and frontend
  - List all required environment variables
  - Include API endpoint documentation
  - Add development and deployment instructions
  - Document security considerations
  - _Requirements: 17.5_
