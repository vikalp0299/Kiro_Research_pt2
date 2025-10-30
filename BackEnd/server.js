const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const logger = require('./Middleware/logger');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Routes
app.use('/api/loginFunc', require('./Router/authRoutes'));
app.use('/api/classFunc', require('./Router/classRoutes'));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ success: true, message: 'Server is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    code: 'INTERNAL_ERROR'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    code: 'NOT_FOUND'
  });
});

// Initialize database and start server
async function startServer() {
  try {
    // Try to initialize database on startup
    console.log('🔧 Attempting database initialization...');
    try {
      // Dynamically import database initialization to avoid loading config at startup
      const { initializeDatabase } = require('../Database/init');
      await initializeDatabase();
      console.log('✅ Database initialized successfully');
    } catch (dbError) {
      console.warn('⚠️  Database initialization failed:', dbError.message);
      console.warn('🔧 Server will start without database initialization');
      console.warn('💡 Configure AWS credentials in Database/.env to enable database features');
      console.warn('📋 Run "npm run dev:database" separately to initialize database');
    }
    
    // Start the server regardless of database status
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🌐 API endpoints: http://localhost:${PORT}/api/`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    process.exit(1);
  }
}

// Only start server if not in test environment
if (process.env.NODE_ENV !== 'test') {
  startServer();
}

module.exports = app;