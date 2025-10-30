# Class Registration System - Dependencies Reference

## Project Structure
```
/
├── FrontEnd/          # React/Next.js application
├── BackEnd/           # Express.js API server
└── Database/          # DynamoDB connection and utilities
```

## Backend Dependencies (BackEnd/package.json)

### Production Dependencies
- **express** (^4.18.2) - Web framework for Node.js
- **@aws-sdk/client-dynamodb** (^3.450.0) - AWS SDK v3 DynamoDB client
- **@aws-sdk/lib-dynamodb** (^3.450.0) - AWS SDK v3 DynamoDB document client
- **bcrypt** (^5.1.1) - Password hashing library
- **jsonwebtoken** (^9.0.2) - JWT token generation and verification
- **cors** (^2.8.5) - Cross-Origin Resource Sharing middleware
- **dotenv** (^16.3.1) - Environment variable loader

### Development Dependencies
- **nodemon** (^3.0.1) - Development server with auto-restart
- **jest** (^29.7.0) - Testing framework
- **supertest** (^6.3.3) - HTTP assertion library for testing

## Frontend Dependencies (FrontEnd/package.json)

### Production Dependencies
- **react** (^18.2.0) - React library
- **react-dom** (^18.2.0) - React DOM renderer
- **next** (^14.0.0) - Next.js framework

### Development Dependencies
- **@types/node** (^20.8.0) - TypeScript definitions for Node.js
- **@types/react** (^18.2.0) - TypeScript definitions for React
- **@types/react-dom** (^18.2.0) - TypeScript definitions for React DOM
- **eslint** (^8.52.0) - JavaScript linter
- **eslint-config-next** (^14.0.0) - ESLint configuration for Next.js
- **jest** (^29.7.0) - Testing framework
- **@testing-library/react** (^13.4.0) - React testing utilities
- **@testing-library/jest-dom** (^6.1.0) - Jest DOM matchers

## Database Dependencies (Database/package.json)

### Production Dependencies
- **@aws-sdk/client-dynamodb** (^3.450.0) - AWS SDK v3 DynamoDB client
- **@aws-sdk/lib-dynamodb** (^3.450.0) - AWS SDK v3 DynamoDB document client
- **bcrypt** (^5.1.1) - Password hashing library
- **dotenv** (^16.3.1) - Environment variable loader

### Development Dependencies
- **jest** (^29.7.0) - Testing framework

## Installation Commands

To install dependencies for each component:

```bash
# Backend
cd BackEnd
npm install

# Frontend
cd FrontEnd
npm install

# Database
cd Database
npm install
```

## Development Scripts

### Backend
- `npm start` - Start production server
- `npm run dev` - Start development server with nodemon
- `npm test` - Run tests

### Frontend
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm test` - Run tests

### Database
- `npm test` - Run tests

## Requirements Satisfied
- **Requirement 8.1**: Database initialization with DynamoDB tables
- **Requirement 8.2**: Sample data population for testing

## Technology Stack Summary
- **Frontend**: React.js with Next.js framework
- **Backend**: Node.js with Express.js framework
- **Database**: AWS DynamoDB with AWS SDK v3
- **Authentication**: JWT tokens with bcrypt password encryption
- **Development**: nodemon for backend development server