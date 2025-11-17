/**
 * Example usage of security middleware in Express application
 * This demonstrates how to integrate helmet and CORS configuration
 * 
 * This file should be used as a reference when implementing the main server.js
 */

const express = require('express');
const { applySecurityMiddleware } = require('./security');

const app = express();

// IMPORTANT: Apply security middleware EARLY in the middleware chain
// This should come before other middleware like body parsers and route handlers

// 1. Apply security headers and CORS
applySecurityMiddleware(app);

// 2. Then apply other middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 3. Apply logging middleware
// const { logRequest } = require('./logger');
// app.use(logRequest);

// 4. Apply rate limiting
// const { globalRateLimiter } = require('./rateLimiter');
// app.use(globalRateLimiter);

// 5. Mount routers
// app.use('/api/loginFunc', loginRoutes);
// app.use('/api/classFunc', classRoutes);

// 6. Error handling middleware (should be last)
// app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV}`);
  console.log(`CORS enabled for: ${process.env.ALLOWED_ORIGINS}`);
});

module.exports = app;
