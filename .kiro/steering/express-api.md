---
inclusion: always
---

# Express.js API Development Guidelines

## Project Structure
```
/BackEnd
  /Controller     - Business logic and request handlers
  /Router         - Route definitions and middleware mounting
  /Middleware     - Custom middleware (auth, logging, validation)
  /Logs           - Application logs
```

## Router Organization
- Create separate routers for different resource types
- Use express.Router() for modular route definitions
- Mount routers with appropriate base paths
- Group related routes together

## Route Definition Patterns
```javascript
const router = express.Router();

// Apply middleware to all routes in router
router.use(authMiddleware);

// Define routes
router.get('/', controller.getAll);
router.get('/:id', controller.getById);
router.post('/', validateBody, controller.create);
router.put('/:id', validateBody, controller.update);
router.delete('/:id', controller.delete);

// Mount router
app.use('/api/resource', router);
```

## Middleware Best Practices
- Order matters: Apply middleware in correct sequence
- Use router-level middleware for route-specific logic
- Use app-level middleware for global functionality
- Call next() to pass control to next middleware
- Use next('route') to skip remaining route handlers
- Use next('router') to skip remaining router handlers
- Use next(error) to trigger error handling middleware

## Authentication Middleware
- Verify JWT tokens on protected routes
- Extract user info from token and attach to req.user
- Return 401 for missing/invalid tokens
- Return 403 for valid tokens with insufficient permissions
- Implement token blacklist checking

## Request Validation
- Validate all user inputs on server-side
- Use express-validator or similar library
- Validate request body, params, and query
- Return 400 for validation errors with clear messages
- Sanitize inputs to prevent injection attacks

## Error Handling
- Implement centralized error handling middleware
- Use try-catch in async route handlers
- Return appropriate HTTP status codes
- Don't expose stack traces in production
- Log errors with context for debugging
- Return consistent error response format

## Response Patterns
```javascript
// Success with data
res.status(200).json({ data: result });

// Created
res.status(201).json({ data: newResource });

// No content
res.status(204).send();

// Bad request
res.status(400).json({ error: 'Validation failed', details: errors });

// Unauthorized
res.status(401).json({ error: 'Authentication required' });

// Forbidden
res.status(403).json({ error: 'Insufficient permissions' });

// Not found
res.status(404).json({ error: 'Resource not found' });

// Server error
res.status(500).json({ error: 'Internal server error' });
```

## Security Headers
- Use helmet.js for security headers
- Enable CORS with specific origins
- Set Content-Security-Policy
- Enable X-Content-Type-Options: nosniff
- Enable X-Frame-Options: DENY
- Enable Strict-Transport-Security

## Rate Limiting
- Implement rate limiting on all endpoints
- Use stricter limits on authentication endpoints
- Return 429 Too Many Requests when limit exceeded
- Include Retry-After header in response

## Logging
- Log all requests with method, path, status, response time
- Log authentication attempts (success and failure)
- Log errors with stack traces
- Use structured logging (JSON format)
- Don't log sensitive data (passwords, tokens)
- Implement log rotation

## API Versioning
- Include version in URL path: /api/v1/resource
- Maintain backward compatibility when possible
- Document breaking changes clearly
- Provide migration guides for version updates

## CORS Configuration
```javascript
const cors = require('cors');

app.use(cors({
  origin: process.env.ALLOWED_ORIGINS.split(','),
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## Request Size Limits
- Set body size limits to prevent DoS
- Use express.json({ limit: '10mb' })
- Set timeout limits for requests
- Implement request throttling
