const helmet = require('helmet');
const cors = require('cors');

/**
 * Configure Helmet.js security headers
 * Implements comprehensive security headers following OWASP best practices
 */
const configureHelmet = () => {
  return helmet({
    // Content Security Policy
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'"],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    // Strict Transport Security (HSTS)
    hsts: {
      maxAge: 31536000, // 1 year in seconds
      includeSubDomains: true,
      preload: true,
    },
    // X-Frame-Options
    frameguard: {
      action: 'deny',
    },
    // X-Content-Type-Options
    noSniff: true,
    // X-XSS-Protection (legacy browsers)
    xssFilter: true,
    // Referrer Policy
    referrerPolicy: {
      policy: 'strict-origin-when-cross-origin',
    },
    // Hide X-Powered-By header
    hidePoweredBy: true,
    // DNS Prefetch Control
    dnsPrefetchControl: {
      allow: false,
    },
    // Download Options for IE8+
    ieNoOpen: true,
    // Permissions Policy
    permittedCrossDomainPolicies: {
      permittedPolicies: 'none',
    },
  });
};

/**
 * Configure CORS with specific allowed origins
 * Supports multiple origins from environment variables
 */
const configureCORS = () => {
  const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim())
    : ['http://localhost:3000'];

  return cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) {
        return callback(null, true);
      }

      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true, // Enable credentials (cookies, authorization headers)
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    exposedHeaders: ['Content-Length', 'X-Request-Id'],
    maxAge: 86400, // 24 hours - how long the results of a preflight request can be cached
  });
};

/**
 * Apply all security middleware to Express app
 * @param {Express} app - Express application instance
 */
const applySecurityMiddleware = (app) => {
  // Apply Helmet security headers
  app.use(configureHelmet());

  // Apply CORS configuration
  app.use(configureCORS());

  // Additional security headers not covered by Helmet
  app.use((req, res, next) => {
    // Remove server signature
    res.removeHeader('X-Powered-By');
    
    // Add custom security headers
    res.setHeader('X-Request-Id', req.id || generateRequestId());
    
    next();
  });
};

/**
 * Generate a unique request ID for tracking
 * @returns {string} Unique request identifier
 */
const generateRequestId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
};

module.exports = {
  configureHelmet,
  configureCORS,
  applySecurityMiddleware,
};
