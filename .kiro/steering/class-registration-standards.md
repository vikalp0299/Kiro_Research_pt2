---
inclusion: always
---

# Class Registration Application Development Standards

## Project Overview

This steering document provides development standards and guidelines for implementing the Class Registration System - a full-stack web application with React/Next.js frontend, Express.js backend, and AWS DynamoDB database.

## Architecture Standards

### Directory Structure
Follow the exact three-tier structure:
```
/
├── FrontEnd/          # React/Next.js application
├── BackEnd/           # Express.js API server
└── Database/          # DynamoDB connection and utilities
```

### Technology Stack Requirements
- **Frontend**: React.js with Next.js framework (latest stable versions)
- **Backend**: Node.js with Express.js framework
- **Database**: AWS DynamoDB with AWS SDK v3 (not v2)
- **Authentication**: JWT tokens with bcrypt password encryption
- **Development**: nodemon for backend development server

## Coding Standards

### File Naming Conventions
- Use camelCase for JavaScript files: `userController.js`, `authMiddleware.js`
- Use kebab-case for directories: `class-registration-app`
- Use PascalCase for React components: `LoginPage.jsx`, `Dashboard.jsx`

### Database Standards
- **Table Names**: Use exact names - `studentUserDB`, `classDB`, `classRegistrationDB`
- **Primary Keys**: 
  - `userID` (Number) for studentUserDB
  - `classId` (String) for classDB
  - Composite key (classId + userID) for classRegistrationDB
- **Status Values**: Use exact strings - "enrolled", "dropped"
- **Class ID Format**: Follow pattern like "IFT 593", "CSE 201" (3-letter prefix + space + 3-digit number)

### API Standards
- **Base Routes**: 
  - Authentication: `/api/loginFunc/`
  - Class Management: `/api/classFunc/`
- **HTTP Methods**: 
  - POST for registration, login, enroll, drop
  - GET for retrieving data
- **Response Format**: Always return JSON with consistent structure:
  ```javascript
  // Success
  { success: true, data: {...}, token: "jwt_token" }
  
  // Error
  { success: false, message: "Error description", code: "ERROR_CODE" }
  ```

### Security Requirements
- **Password Policy**: Minimum 10 characters with mixed case, numbers, and special characters
- **JWT Implementation**: Include proper expiration and blacklisting for logout
- **Input Validation**: Sanitize all user inputs before database operations
- **Error Handling**: Never expose internal system details in error messages

## Development Workflow

### Implementation Order
1. Database layer first (connection, schemas, CRUD operations)
2. Backend API (authentication, then class management)
3. Frontend components (authentication pages, then dashboard)
4. Integration testing and styling

### Testing Requirements
- Write unit tests for all database functions
- Test all API endpoints with various scenarios
- Implement frontend component testing
- Include end-to-end user flow testing

### AWS DynamoDB Guidelines
- Use **on-demand billing** to stay within free tier
- Implement efficient queries to minimize read/write operations
- Always check if tables exist before creating
- Use proper error handling for AWS operations
- Configure appropriate IAM permissions

## Code Quality Standards

### Error Handling
- Always use try-catch blocks for async operations
- Implement proper HTTP status codes (200, 400, 401, 404, 500)
- Log errors appropriately without exposing sensitive data
- Provide meaningful error messages to users

### Function Naming
Use exact function names as specified in requirements:
- `createDatabase()`, `userExistsInDB()`, `pushUserData()`
- `registerStudentUser()`, `loginStudentUser()`, `logoutStudentUser()`
- `displayAllAvailableClasses()`, `registerClass()`, `deregisterClass()`

### Data Validation
- Validate email format on both frontend and backend
- Implement real-time password strength feedback
- Check for duplicate usernames and emails
- Validate class enrollment status before operations

## Frontend Standards

### React/Next.js Guidelines
- Use functional components with hooks
- Implement proper state management for user authentication
- Store JWT tokens securely (consider httpOnly cookies vs localStorage)
- Create reusable components for forms and class displays

### UI/UX Requirements
- Implement responsive design for mobile and desktop
- Provide clear feedback for user actions (success/error messages)
- Include loading states for API calls
- Follow modern, clean design principles

### Navigation Structure
- Login/Registration pages for unauthenticated users
- Dashboard with three tabs: Available Classes, My Classes, Dropped Classes
- Proper logout functionality that clears authentication state

## Backend Standards

### Express.js Structure
```
BackEnd/
├── Controller/        # Business logic functions
├── Router/           # Route definitions
├── Middleware/       # Authentication, logging, validation
└── Logs/            # Application logs
```

### Middleware Requirements
- Authentication middleware for protected routes
- Request logging with color-coded output
- Password utility functions using bcrypt
- Proper CORS configuration for frontend communication

## Database Implementation

### DynamoDB Table Schemas
Implement exact schemas as defined in design document:
- **studentUserDB**: userID, username, fullName, email, password
- **classDB**: classId, className, credits (3 or 4), description
- **classRegistrationDB**: classId, userID, className, registrationStatus

### Sample Data Requirements
- Generate 5-10 sample classes on database initialization
- Use realistic course prefixes: IFT, CSE, CCE, EEE
- Assign appropriate credits (3 or 4) and descriptions
- Only populate sample data when tables are first created

## Performance Considerations

### Optimization Guidelines
- Implement efficient DynamoDB queries using proper keys
- Minimize API calls through proper state management
- Use appropriate caching strategies for class data
- Optimize bundle size for frontend application

### Monitoring
- Implement proper logging for debugging
- Monitor AWS usage to stay within free tier limits
- Track API response times and error rates
- Log user actions for troubleshooting

## Deployment Considerations

### Development Environment
- Use nodemon for backend development server
- Configure Next.js development server with hot reload
- Create startup scripts for easy development workflow
- Ensure proper environment variable management

### Production Readiness
- Implement proper environment configuration
- Secure API endpoints and database connections
- Configure proper CORS policies
- Implement rate limiting for API protection

This steering document should be referenced throughout the implementation process to ensure consistency and adherence to project requirements.