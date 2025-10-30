# Class Registration System - Development Setup

This document provides comprehensive instructions for setting up and running the Class Registration System in development mode.

## Prerequisites

- **Node.js** 16+ and npm
- **AWS Account** with DynamoDB access (free tier is sufficient)
- **Git** for version control

## Quick Start

### 1. Initial Setup

Run the automated setup script:

```bash
./scripts/dev-setup.sh
```

This will:
- Install all dependencies for all components
- Create environment files from templates
- Set up the project structure

### 2. Configure Environment

Update the environment files with your configuration:

**BackEnd/.env:**
```env
PORT=3001
JWT_SECRET=your-super-secret-jwt-key-change-in-production
```

**Database/.env:**
```env
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

### 3. Start Development

Run the development startup script:

```bash
./scripts/start-dev.sh
```

Or manually:

```bash
npm run setup  # Initialize database with sample data
npm run dev    # Start both frontend and backend
```

## Available Scripts

### Root Level Commands

| Command | Description |
|---------|-------------|
| `npm run install:all` | Install dependencies for all components |
| `npm run dev` | Start both frontend and backend in development mode |
| `npm run dev:backend` | Start only backend server (port 3001) |
| `npm run dev:frontend` | Start only frontend server (port 3000) |
| `npm run dev:database` | Initialize database with sample data |
| `npm run start` | Start both servers in production mode |
| `npm run test` | Run all tests across all components |
| `npm run setup` | Full setup: install dependencies + initialize database |
| `npm run health` | Check if servers are running |
| `npm run clean` | Remove all node_modules directories |

### Component-Specific Commands

**Backend (BackEnd/):**
- `npm run dev` - Start with nodemon (auto-restart)
- `npm start` - Start in production mode
- `npm test` - Run backend tests

**Frontend (FrontEnd/):**
- `npm run dev` - Start Next.js development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm test` - Run frontend tests

**Database (Database/):**
- `npm run init` - Initialize database and add sample data
- `npm test` - Run database tests

## Development Workflow

### 1. Starting Development

```bash
# First time setup
./scripts/dev-setup.sh

# Daily development
./scripts/start-dev.sh
```

### 2. Development Servers

- **Frontend**: http://localhost:3000 (Next.js with hot reload)
- **Backend**: http://localhost:3001 (Express.js with nodemon)
- **Health Check**: http://localhost:3001/health

### 3. Database Management

The database is automatically initialized when the backend starts. Sample data includes:
- 5-10 sample classes with realistic course codes (IFT, CSE, CCE, EEE)
- Proper table schemas for users, classes, and registrations

### 4. Testing

```bash
# Run all tests
npm test

# Run specific component tests
npm run test:backend
npm run test:frontend
npm run test:database
```

## Project Structure

```
class-registration-system/
├── BackEnd/                 # Express.js API server
│   ├── Controller/         # Business logic
│   ├── Router/            # Route definitions
│   ├── Middleware/        # Auth, logging, validation
│   ├── Logs/             # Application logs
│   └── __tests__/        # Backend tests
├── FrontEnd/              # React/Next.js application
│   ├── pages/            # Next.js pages
│   ├── styles/           # CSS styles
│   ├── utils/            # Utility functions
│   └── __tests__/        # Frontend tests
├── Database/              # DynamoDB utilities
│   └── __tests__/        # Database tests
└── scripts/              # Development scripts
```

## Environment Configuration

### Backend Environment Variables

```env
# Server Configuration
PORT=3001

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-in-production

# AWS Configuration (optional for backend)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key
AWS_REGION=us-east-1
```

### Database Environment Variables

```env
# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
```

## Troubleshooting

### Common Issues

1. **Port Already in Use**
   ```bash
   # Kill processes on ports 3000 and 3001
   lsof -ti:3000 | xargs kill -9
   lsof -ti:3001 | xargs kill -9
   ```

2. **AWS Credentials Not Found**
   - Ensure AWS credentials are set in Database/.env
   - Or configure AWS CLI: `aws configure`

3. **Database Connection Issues**
   - Check AWS credentials and region
   - Verify DynamoDB permissions
   - Check AWS free tier limits

4. **Dependencies Issues**
   ```bash
   # Clean and reinstall
   npm run clean
   npm run install:all
   ```

### Health Checks

```bash
# Check if servers are running
npm run health

# Manual health checks
curl http://localhost:3001/health
curl http://localhost:3000
```

### Logs

- Backend logs: `BackEnd/Logs/access-YYYY-MM-DD.log`
- Console output with color-coded request logging
- Error logs in console and log files

## Development Features

### Hot Reload
- **Frontend**: Automatic reload on file changes (Next.js)
- **Backend**: Automatic restart on file changes (nodemon)

### Database Auto-Initialization
- Tables created automatically on first run
- Sample data populated automatically
- Idempotent operations (safe to run multiple times)

### Comprehensive Testing
- Unit tests for all components
- Integration tests for API endpoints
- Frontend component tests
- Database operation tests

### Security Features
- JWT authentication with proper middleware
- Password encryption with bcrypt
- Input validation and sanitization
- CORS configuration for development

## Production Considerations

When moving to production:

1. Update environment variables with production values
2. Use `npm run start` instead of `npm run dev`
3. Configure proper AWS IAM roles and permissions
4. Set up proper logging and monitoring
5. Configure HTTPS and proper CORS policies
6. Set up CI/CD pipelines for automated deployment

## Support

For issues or questions:
1. Check this documentation
2. Review the troubleshooting section
3. Check component-specific README files
4. Review test files for usage examples