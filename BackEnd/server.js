require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const { globalLimiter } = require('./Middleware/rateLimiter');
const { logRequest } = require('./Middleware/logger');
const loginRoutes = require('./Router/loginRoutes');
const classRoutes = require('./Router/classRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware - Applied in correct order
app.use(logRequest); // Logging middleware
app.use(helmet()); // Security headers
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
})); // CORS
app.use(globalLimiter); // Rate limiting
app.use(express.json({ limit: '10mb' })); // Body parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Mount authentication routes
app.use('/api/loginFunc', loginRoutes);

// Mount class management routes
app.use('/api/classFunc', classRoutes);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler - must come after all route definitions
app.use((req, res) => {
  res.status(404).json({ 
    error: 'Route not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// Centralized error handling middleware - must be last
app.use((err, req, res, next) => {
  // Import logger for error logging
  const { logError } = require('./Middleware/logger');
  
  // Log error with context
  logError(err, {
    method: req.method,
    path: req.path,
    ip: req.headers['x-forwarded-for']?.split(',')[0].trim() || 
        req.connection.remoteAddress || 
        req.socket.remoteAddress ||
        'unknown',
    userId: req.user?.userId || null,
    statusCode: err.statusCode || 500
  });

  // Determine status code from error or default to 500
  let statusCode = err.statusCode || 500;

  // Handle specific error types
  if (err.name === 'ValidationError') {
    statusCode = 400;
  } else if (err.name === 'UnauthorizedError' || err.name === 'JsonWebTokenError') {
    statusCode = 401;
  } else if (err.name === 'ForbiddenError') {
    statusCode = 403;
  } else if (err.name === 'NotFoundError') {
    statusCode = 404;
  } else if (err.name === 'ConflictError') {
    statusCode = 409;
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
  }

  // Build error response
  const errorResponse = {
    error: statusCode === 500 ? 'Internal server error' : err.message,
    timestamp: new Date().toISOString()
  };

  // Add request ID if available
  if (req.id) {
    errorResponse.requestId = req.id;
  }

  // Add details in development mode only
  if (process.env.NODE_ENV === 'development') {
    errorResponse.details = {
      stack: err.stack,
      name: err.name,
      code: err.code
    };
  }

  // Send error response
  res.status(statusCode).json(errorResponse);
});

// Initialize database tables on startup
async function initializeDatabase() {
  try {
    console.log('🔄 Initializing database tables...');
    
    const { createDatabase } = require('./database/userOperations');
    const { createClassDB, addDummyDataToClassDB } = require('./database/classOperations');
    const { createRegistrationDB } = require('./database/registrationOperations');
    const { createMFATable } = require('./database/mfaOperations');
    
    // Create tables
    await createDatabase();
    await createClassDB();
    await createRegistrationDB();
    await createMFATable();
    
    // Add dummy data to classDB if needed
    await addDummyDataToClassDB();
    
    console.log('✅ Database initialization complete');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Start server
if (require.main === module) {
  // Initialize database before starting server
  initializeDatabase()
    .then(() => {
      app.listen(PORT, () => {
        console.log('\n' + '='.repeat(60));
        console.log('🚀 Class Registration App - Backend Server');
        console.log('='.repeat(60));
        console.log(`📡 Server running on port ${PORT}`);
        console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`🔗 Frontend URL: ${process.env.FRONTEND_URL || 'Not configured'}`);
        console.log(`🔒 CORS Origins: ${process.env.ALLOWED_ORIGINS || 'Not configured'}`);
        console.log('='.repeat(60) + '\n');
      });
    })
    .catch((error) => {
      console.error('❌ Failed to start server:', error);
      process.exit(1);
    });
}

module.exports = app;
