# Requirements Document

## Introduction

The Class Registration App is a full-stack web application that enables students to register for classes, view available courses, manage their enrollments, and track dropped classes. The system consists of three major components: a React/Next.js frontend, an Express.js backend API, and AWS DynamoDB database storage. The application implements secure authentication using JWT tokens and bcrypt password hashing, following industry best practices for web security.

## Glossary

- **System**: The Class Registration App
- **Student User**: A registered user who can enroll in classes
- **Class**: An academic course offering with a unique identifier, name, credits, and description
- **Registration**: The enrollment status of a student in a class (enrolled or dropped)
- **JWT Token**: JSON Web Token used for authentication
- **Backend API**: Express.js server handling business logic and data operations
- **Frontend Client**: React/Next.js web application providing the user interface
- **Database**: AWS DynamoDB tables storing user, class, and registration data

## Requirements

### Requirement 1: User Authentication and Registration

**User Story:** As a student, I want to create an account and log in securely, so that I can access the class registration system.

#### Acceptance Criteria

1. WHEN a student submits registration form with username, full name, email, and password, THE System SHALL validate the input format and password strength
2. WHEN the password meets complexity requirements (minimum 12 characters, uppercase, lowercase, numbers, special characters), THE System SHALL encrypt the password using bcrypt with minimum 12 salt rounds
3. WHEN a student attempts to register with an existing username or email, THE System SHALL return an error message within 2 seconds indicating the specific conflict type
4. WHEN a student successfully registers, THE System SHALL generate a unique 10-digit user ID and create a JWT token with 30-minute expiration
5. WHEN a student submits valid login credentials, THE System SHALL verify the password against the stored hash and return a JWT token
6. WHEN a student fails login 5 times within 15 minutes, THE System SHALL block further login attempts for 15 minutes with incremental time increases for subsequent violations
7. WHEN a student logs out, THE System SHALL blacklist the JWT token to prevent reuse

### Requirement 2: Class Information Management

**User Story:** As a student, I want to view all available classes and my enrolled classes, so that I can make informed decisions about my course selection.

#### Acceptance Criteria

1. WHEN the System starts, THE System SHALL create three DynamoDB tables (studentUserDB, classDB, classRegistrationDB) if they do not exist
2. WHEN classDB is created and contains zero items, THE System SHALL populate it with 5 to 10 dummy classes with random IFT, CSE, CCE, or EEE course codes
3. WHEN a student requests available classes, THE System SHALL return all classes excluding those already enrolled by the student
4. WHEN a student requests enrolled classes, THE System SHALL return all classes with registration status "enrolled" for that student
5. WHEN a student requests dropped classes, THE System SHALL return all classes with registration status "dropped" for that student
6. WHEN the System queries class data, THE System SHALL include class ID, class name, credits, and description in the response

### Requirement 3: Class Registration and Enrollment

**User Story:** As a student, I want to enroll in and drop classes, so that I can manage my course schedule.

#### Acceptance Criteria

1. WHEN a student clicks enroll on an available class, THE System SHALL verify the student is not already enrolled in that class
2. WHEN a student re-enrolls in a previously dropped class, THE System SHALL update the registration status from "dropped" to "enrolled"
3. WHEN a student successfully enrolls in a class, THE System SHALL create or update a registration record with status "enrolled"
4. WHEN a student clicks unenroll on an enrolled class, THE System SHALL update the registration status to "dropped"
5. WHEN a student attempts to enroll in an already enrolled class, THE System SHALL return an error message
6. WHEN a student attempts to unenroll from a non-enrolled class, THE System SHALL return an error message

### Requirement 4: Password Security and Authentication

**User Story:** As a system administrator, I want robust password security measures, so that user credentials are protected against attacks.

#### Acceptance Criteria

1. WHEN the System hashes passwords, THE System SHALL use bcrypt with minimum 12 salt rounds (recommended 14 for production)
2. WHEN the System validates passwords during registration, THE System SHALL enforce minimum 12 characters with uppercase, lowercase, numbers, and special characters
3. WHEN the System receives password input, THE System SHALL check against common password dictionaries to prevent weak passwords
4. WHEN the System stores passwords, THE System SHALL never store plain text passwords in the database
5. WHEN the System compares passwords during login, THE System SHALL use bcrypt.compare() for secure comparison
6. WHEN a user changes password, THE System SHALL implement password history to prevent reuse of recent passwords
7. WHEN the System implements password reset, THE System SHALL use secure time-limited single-use tokens
8. WHEN the System detects password reset requests, THE System SHALL rate limit requests to prevent abuse

### Requirement 5: JWT Token Security

**User Story:** As a security engineer, I want secure token management, so that authentication tokens cannot be compromised or misused.

#### Acceptance Criteria

1. WHEN the System generates JWT secrets, THE System SHALL use randomly generated secrets with minimum 256 bits
2. WHEN the System stores JWT secrets, THE System SHALL store them in environment variables and never hardcode them
3. WHEN the System creates access tokens, THE System SHALL set expiration time between 15-30 minutes
4. WHEN the System creates refresh tokens, THE System SHALL set expiration time between 7-30 days
5. WHEN the System signs tokens, THE System SHALL include issuer and audience claims for validation
6. WHEN the System verifies tokens, THE System SHALL validate signature, expiration, issuer, and audience on every request
7. WHEN the System implements logout, THE System SHALL blacklist tokens to prevent reuse
8. WHEN the System refreshes tokens, THE System SHALL implement token rotation for enhanced security
9. WHEN the System transmits tokens, THE System SHALL use HTTPS only and never expose tokens in URL parameters or logs
10. WHEN the System stores tokens client-side, THE System SHALL prefer httpOnly cookies over localStorage

### Requirement 6: Session Management and Access Control

**User Story:** As a security administrator, I want secure session management, so that user sessions are protected and properly controlled.

#### Acceptance Criteria

1. WHEN a user session is inactive for 30 minutes, THE System SHALL automatically timeout the session
2. WHEN a user logs out, THE System SHALL clear all authentication data from client and server
3. WHEN a user fails login 5 times, THE System SHALL implement rate limiting with incremental time bans
4. WHEN the System detects concurrent sessions, THE System SHALL allow or prevent based on configuration
5. WHEN a user changes password, THE System SHALL invalidate all existing sessions
6. WHEN the System implements two-factor authentication, THE System SHALL generate 6-digit random numeric codes with 10-minute expiration
7. WHEN the System sends MFA codes, THE System SHALL verify email address exists in database before sending
8. WHEN a user enters incorrect MFA code 3 times consecutively, THE System SHALL allow one code resend attempt or lock the account for 30 minutes
9. WHEN the System detects suspicious login patterns including multiple failed attempts from different IP addresses within 1 hour, THE System SHALL flag the account for administrator review within 5 minutes

### Requirement 7: Input Validation and Data Security

**User Story:** As a developer, I want comprehensive input validation, so that the application is protected against injection attacks and malicious input.

#### Acceptance Criteria

1. WHEN the System receives user input, THE System SHALL validate ALL inputs on both client-side AND server-side
2. WHEN the System validates email format, THE System SHALL use proper regex patterns
3. WHEN the System validates username format, THE System SHALL enforce alphanumeric characters with length constraints
4. WHEN the System receives input, THE System SHALL sanitize all inputs to prevent code injection
5. WHEN the System processes input, THE System SHALL implement strict type checking for all inputs
6. WHEN the System handles file uploads, THE System SHALL validate file type, size, and content
7. WHEN the System constructs database queries, THE System SHALL use parameterized queries or prepared statements
8. WHEN the System receives classId or userId, THE System SHALL validate and sanitize before using in queries
9. WHEN the System renders user-generated content, THE System SHALL escape HTML special characters to prevent XSS
10. WHEN the System implements Content Security Policy, THE System SHALL configure CSP headers to prevent XSS attacks

### Requirement 8: API Security and Protection

**User Story:** As an API developer, I want secure API endpoints, so that the application is protected against common web attacks.

#### Acceptance Criteria

1. WHEN the System receives API requests, THE System SHALL implement rate limiting of 100 requests per 15 minutes
2. WHEN the System receives authentication requests, THE System SHALL apply stricter rate limiting of 5 attempts per 15 minutes
3. WHEN the System configures CORS, THE System SHALL specify allowed origins and not use wildcard in production
4. WHEN the System communicates, THE System SHALL enforce HTTPS/TLS with minimum TLS 1.2
5. WHEN the System implements API versioning, THE System SHALL maintain backward compatibility when possible
6. WHEN the System receives requests, THE System SHALL implement request size limits to prevent DoS attacks
7. WHEN the System processes requests, THE System SHALL implement request timeout limits
8. WHEN the System responds, THE System SHALL use security headers including X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Strict-Transport-Security, and Content-Security-Policy
9. WHEN the System uses Helmet.js, THE System SHALL configure all recommended security headers
10. WHEN the System protects endpoints, THE System SHALL verify JWT token on EVERY protected route

### Requirement 9: Authentication Middleware and Authorization

**User Story:** As a backend developer, I want secure authentication middleware, so that protected routes are properly secured.

#### Acceptance Criteria

1. WHEN the System implements authentication middleware, THE System SHALL verify JWT token on every protected route
2. WHEN the System encounters token errors, THE System SHALL implement proper error handling without exposing sensitive information
3. WHEN the System validates tokens, THE System SHALL check token against blacklist on every request
4. WHEN the System authorizes requests, THE System SHALL validate user permissions for each operation
5. WHEN the System executes middleware, THE System SHALL implement correct execution order
6. WHEN the System logs authentication events, THE System SHALL log all authentication failures for monitoring
7. WHEN the System validates operations, THE System SHALL ensure userId from JWT matches the requested operation
8. WHEN the System handles login attempts, THE System SHALL prevent enumeration attacks by not revealing if user/email exists
9. WHEN the System implements CSRF protection, THE System SHALL protect all state-changing operations

### Requirement 10: Database Access Control and Security

**User Story:** As a database administrator, I want secure database access, so that data is protected from unauthorized access.

#### Acceptance Criteria

1. WHEN the System accesses AWS services, THE System SHALL use IAM roles with least privilege principle
2. WHEN the System connects to database, THE System SHALL create separate database users for different operations
3. WHEN the System stores database credentials, THE System SHALL never use root/admin credentials in application code
4. WHEN the System stores database credentials, THE System SHALL store them in environment variables
5. WHEN the System connects to database, THE System SHALL implement database connection encryption using SSL/TLS
6. WHEN the System configures database access, THE System SHALL use VPC security groups to restrict database access
7. WHEN the System manages credentials, THE System SHALL regularly rotate database credentials
8. WHEN the System performs database operations, THE System SHALL enable database audit logging
9. WHEN the System stores sensitive data, THE System SHALL encrypt data at rest
10. WHEN the System implements backups, THE System SHALL encrypt database backups

### Requirement 11: Data Protection and Query Security

**User Story:** As a security engineer, I want secure data handling, so that data integrity and confidentiality are maintained.

#### Acceptance Criteria

1. WHEN the System stores additional PII, THE System SHALL encrypt sensitive data at rest
2. WHEN the System implements backups, THE System SHALL enable database backups with encryption
3. WHEN the System uses DynamoDB, THE System SHALL enable DynamoDB encryption features
4. WHEN the System deletes data, THE System SHALL implement soft deletes instead of hard deletes for audit trails
5. WHEN the System encounters database errors, THE System SHALL sanitize error messages before sending to client
6. WHEN the System processes updates, THE System SHALL prevent mass assignment vulnerabilities
7. WHEN the System performs operations, THE System SHALL implement transaction management for data consistency
8. WHEN the System validates relationships, THE System SHALL validate foreign key relationships before operations
9. WHEN the System performs updates or deletes, THE System SHALL implement existence checks before operations
10. WHEN the System queries data, THE System SHALL limit query result sizes to prevent data leakage
11. WHEN the System returns large datasets, THE System SHALL implement pagination
12. WHEN the System exposes data, THE System SHALL avoid exposing internal database IDs directly if possible

### Requirement 12: Client-Side Security

**User Story:** As a frontend developer, I want secure client-side practices, so that the user interface is protected against attacks.

#### Acceptance Criteria

1. WHEN the System stores tokens, THE System SHALL prefer httpOnly cookies over localStorage
2. WHEN the System uses localStorage for tokens, THE System SHALL implement additional security measures
3. WHEN the System stores tokens, THE System SHALL implement proper token storage and retrieval
4. WHEN the System handles sensitive data, THE System SHALL clear sensitive data from memory after use
5. WHEN the System validates inputs, THE System SHALL validate all inputs before sending to backend
6. WHEN the System handles errors, THE System SHALL implement proper error handling without exposing system details
7. WHEN the System configures API endpoints, THE System SHALL use environment variables for API endpoints
8. WHEN the System implements routing, THE System SHALL protect routes requiring authentication
9. WHEN the System prevents clickjacking, THE System SHALL implement proper CSP headers

### Requirement 13: Dependency and Code Security

**User Story:** As a DevOps engineer, I want secure dependency management, so that the application is protected from vulnerable dependencies.

#### Acceptance Criteria

1. WHEN the System manages dependencies, THE System SHALL regularly update all npm packages
2. WHEN the System checks for vulnerabilities, THE System SHALL use npm audit to check for vulnerabilities
3. WHEN the System manages dependencies, THE System SHALL implement package-lock.json or yarn.lock
4. WHEN the System adds dependencies, THE System SHALL avoid using packages with known vulnerabilities
5. WHEN the System adds dependencies, THE System SHALL review dependencies before adding to project
6. WHEN the System manages updates, THE System SHALL use Dependabot or similar tools for automated updates

### Requirement 14: Security Logging and Monitoring

**User Story:** As a security analyst, I want comprehensive logging, so that security events can be monitored and investigated.

#### Acceptance Criteria

1. WHEN the System logs events, THE System SHALL log ALL authentication attempts (success and failure)
2. WHEN the System logs events, THE System SHALL log ALL authorization failures
3. WHEN the System detects suspicious activity, THE System SHALL log suspicious activities including multiple failed logins and unusual patterns
4. WHEN the System logs events, THE System SHALL include timestamp, IP address, and user identifier in logs
5. WHEN the System logs events, THE System SHALL NEVER log sensitive data including passwords, tokens, or PII
6. WHEN the System manages logs, THE System SHALL implement log rotation and secure storage
7. WHEN the System formats logs, THE System SHALL use structured logging format (JSON)
8. WHEN the System stores logs, THE System SHALL store logs in the /BackEnd/Logs directory

### Requirement 15: Monitoring and Alerting

**User Story:** As a system administrator, I want security monitoring and alerts, so that threats can be detected and responded to quickly.

#### Acceptance Criteria

1. WHEN the System detects attacks, THE System SHALL monitor for brute force attacks
2. WHEN the System detects suspicious activity, THE System SHALL implement alerts for suspicious activities
3. WHEN the System detects violations, THE System SHALL track rate limit violations
4. WHEN the System detects injection attempts, THE System SHALL monitor for SQL injection attempts
5. WHEN the System encounters errors, THE System SHALL set up alerts for application errors
6. WHEN the System monitors health, THE System SHALL implement health check endpoints without exposing sensitive info

### Requirement 16: Error Handling and Information Disclosure

**User Story:** As a security developer, I want secure error handling, so that system information is not leaked through errors.

#### Acceptance Criteria

1. WHEN the System handles errors, THE System SHALL implement centralized error handling middleware
2. WHEN the System encounters errors, THE System SHALL never expose stack traces to clients
3. WHEN the System returns errors, THE System SHALL return generic error messages to users
4. WHEN the System logs errors, THE System SHALL log detailed errors server-side only
5. WHEN the System returns errors, THE System SHALL use appropriate HTTP status codes
6. WHEN the System encounters errors, THE System SHALL avoid revealing system architecture in errors
7. WHEN the System runs in production, THE System SHALL implement different error messages for development vs production
8. WHEN the System responds, THE System SHALL remove or disable server signature headers
9. WHEN the System responds, THE System SHALL not expose technology stack in responses
10. WHEN the System responds, THE System SHALL avoid verbose error messages
11. WHEN the System deploys, THE System SHALL remove comments from production code
12. WHEN the System responds, THE System SHALL not expose database schema information
13. WHEN the System returns data, THE System SHALL sanitize all response data

### Requirement 17: Environment Configuration Security

**User Story:** As a DevOps engineer, I want secure environment configuration, so that secrets and sensitive configuration are protected.

#### Acceptance Criteria

1. WHEN the System stores configuration, THE System SHALL use .env files for all sensitive configuration
2. WHEN the System manages version control, THE System SHALL add .env to .gitignore and NEVER commit secrets
3. WHEN the System uses environments, THE System SHALL use different credentials for development, testing, and production
4. WHEN the System starts, THE System SHALL implement environment variable validation on startup
5. WHEN the System documents configuration, THE System SHALL document all required environment variables
6. WHEN the System initializes, THE System SHALL prompt user to run envSetter.py if .env file is not present
7. WHEN envSetter.py runs, THE System SHALL interactively collect and create .env file with required values

### Requirement 18: User Interface and Experience

**User Story:** As a student, I want an intuitive and responsive interface, so that I can easily navigate and use the application.

#### Acceptance Criteria

1. WHEN a student accesses the application, THE System SHALL display a login page with username/email and password fields
2. WHEN a student clicks the sign-up link, THE System SHALL display a registration form with full name, email, username, and password fields
3. WHEN a student types in the password field during registration, THE System SHALL display real-time password strength feedback
4. WHEN a student successfully logs in, THE System SHALL display a navigation panel with "Available Classes", "My Classes", and "Dropped Classes" tabs
5. WHEN a student views available classes, THE System SHALL display an enroll button for each class
6. WHEN a student views enrolled classes, THE System SHALL display an unenroll button for each class
7. WHEN a student views dropped classes, THE System SHALL display a re-enroll button for each class
8. WHEN the System processes a request, THE System SHALL display loading indicators to provide user feedback
9. WHEN the System encounters an error, THE System SHALL display user-friendly error messages

### Requirement 19: API Design and Implementation

**User Story:** As a developer, I want well-structured API endpoints, so that the frontend can reliably communicate with the backend.

#### Acceptance Criteria

1. WHEN the Backend API starts, THE System SHALL initialize database connections and create tables if needed
2. WHEN the Backend API receives requests, THE System SHALL log request method, path, IP address, status code, and response time
3. WHEN the Backend API defines routes, THE System SHALL organize them into /api/loginFunc and /api/classFunc paths
4. WHEN the Backend API handles authentication requests, THE System SHALL implement functions for register, login, and logout
5. WHEN the Backend API handles class requests, THE System SHALL implement functions for displaying available, enrolled, and dropped classes
6. WHEN the Backend API handles registration requests, THE System SHALL implement functions for enrolling and unenrolling from classes
7. WHEN the Backend API encounters errors, THE System SHALL return appropriate HTTP status codes (400, 401, 404, 500)
8. WHEN the Backend API processes requests, THE System SHALL validate JWT tokens using middleware before accessing protected routes

### Requirement 20: Database Schema and Operations

**User Story:** As a system architect, I want a well-designed database schema, so that data is stored efficiently and relationships are maintained.

#### Acceptance Criteria

1. WHEN studentUserDB is created, THE System SHALL define userId as primary key (Number), username (String), fullName (String), email (String), and encrypted password (String)
2. WHEN classDB is created, THE System SHALL define classId as primary key (String), className (String), credits (Number), and description (String)
3. WHEN classRegistrationDB is created, THE System SHALL define composite key with classId and userId, and include className (String) and registrationState (String)
4. WHEN the System queries by email or username, THE System SHALL use a Global Secondary Index on studentUserDB
5. WHEN the System performs database operations, THE System SHALL use parameterized queries to prevent injection attacks
6. WHEN the System creates or updates records, THE System SHALL validate foreign key relationships exist
7. WHEN the System queries registration data, THE System SHALL filter by userId and registrationState as needed

### Requirement 21: Testing and Quality Assurance

**User Story:** As a quality assurance engineer, I want comprehensive test coverage, so that the application functions correctly and reliably.

#### Acceptance Criteria

1. WHEN tests are executed for backend routes, THE System SHALL use Supertest to test HTTP endpoints
2. WHEN tests are executed for React components, THE System SHALL use React Testing Library to test user interactions
3. WHEN tests are executed for business logic, THE System SHALL use Jest for unit testing
4. WHEN backend tests run, THE System SHALL test authentication flows including registration, login, and logout
5. WHEN backend tests run, THE System SHALL test class operations including enrollment, unenrollment, and data retrieval
6. WHEN frontend tests run, THE System SHALL test form validation, API integration, and state management
7. WHEN tests complete, THE System SHALL generate a test report documenting passed and failed test cases
8. WHEN tests fail, THE System SHALL document the issue in a fix-summary file with troubleshooting steps and improvement prompts
