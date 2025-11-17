# Security Middleware Documentation

## Overview

This module provides comprehensive security middleware for the Express.js backend, implementing OWASP security best practices through Helmet.js security headers and CORS configuration.

## Features

### 1. Security Headers (Helmet.js)

The middleware configures the following security headers:

#### Content-Security-Policy (CSP)
Prevents XSS attacks by controlling which resources can be loaded:
- `default-src 'self'` - Only allow resources from same origin
- `script-src 'self'` - Only allow scripts from same origin
- `style-src 'self' 'unsafe-inline'` - Allow inline styles (for compatibility)
- `img-src 'self' data: https:` - Allow images from same origin, data URIs, and HTTPS
- `object-src 'none'` - Block plugins like Flash
- `frame-src 'none'` - Prevent clickjacking

#### Strict-Transport-Security (HSTS)
Forces HTTPS connections:
- `max-age=31536000` - 1 year duration
- `includeSubDomains` - Apply to all subdomains
- `preload` - Enable HSTS preloading

#### X-Frame-Options
Prevents clickjacking attacks:
- Set to `DENY` - Prevents page from being embedded in frames

#### X-Content-Type-Options
Prevents MIME-sniffing attacks:
- Set to `nosniff` - Browsers must respect declared content types

#### X-XSS-Protection
Legacy XSS protection for older browsers:
- Enables browser's built-in XSS filter

#### Additional Headers
- Referrer Policy: `strict-origin-when-cross-origin`
- DNS Prefetch Control: Disabled
- Hide X-Powered-By: Removes server signature
- Permissions Policy: Restricts browser features

### 2. CORS Configuration

Configures Cross-Origin Resource Sharing with:

- **Allowed Origins**: Configurable via `ALLOWED_ORIGINS` environment variable
- **Credentials Support**: Enabled for cookies and authorization headers
- **Allowed Methods**: GET, POST, PUT, DELETE, OPTIONS
- **Allowed Headers**: Content-Type, Authorization
- **Exposed Headers**: Content-Length, X-Request-Id
- **Preflight Caching**: 24 hours

### 3. Request Tracking

Adds unique request IDs to each request for:
- Debugging and troubleshooting
- Request correlation across logs
- Security audit trails

## Installation

The required packages are already included in package.json:

```json
{
  "dependencies": {
    "helmet": "^7.1.0",
    "cors": "^2.8.5"
  }
}
```

## Configuration

### Environment Variables

Add to your `.env` file:

```bash
# CORS Configuration
ALLOWED_ORIGINS=http://localhost:3001,http://localhost:3000

# For production, use your actual domain:
# ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com
```

### Usage in Express Application

```javascript
const express = require('express');
const { applySecurityMiddleware } = require('./Middleware/security');

const app = express();

// Apply security middleware EARLY in the middleware chain
applySecurityMiddleware(app);

// Then add other middleware
app.use(express.json());
// ... rest of your middleware and routes
```

## API Reference

### `applySecurityMiddleware(app)`

Applies all security middleware to the Express application.

**Parameters:**
- `app` (Express) - Express application instance

**Example:**
```javascript
const app = express();
applySecurityMiddleware(app);
```

### `configureHelmet()`

Returns configured Helmet middleware.

**Returns:** Helmet middleware function

**Example:**
```javascript
app.use(configureHelmet());
```

### `configureCORS()`

Returns configured CORS middleware.

**Returns:** CORS middleware function

**Example:**
```javascript
app.use(configureCORS());
```

## Security Best Practices

### 1. HTTPS Only
Always use HTTPS in production. The HSTS header enforces this, but you must configure your server/load balancer for HTTPS.

### 2. Origin Whitelist
Never use wildcard (`*`) for CORS origins in production. Always specify exact allowed origins:

```bash
# Good
ALLOWED_ORIGINS=https://yourdomain.com,https://app.yourdomain.com

# Bad (never do this in production)
ALLOWED_ORIGINS=*
```

### 3. Content Security Policy
Adjust CSP directives based on your application needs:
- If using CDNs, add them to appropriate directives
- If using inline scripts, consider using nonces instead of `unsafe-inline`
- Monitor CSP violations to detect attacks

### 4. Regular Updates
Keep security packages updated:
```bash
npm update helmet cors
npm audit fix
```

## Testing

Run security middleware tests:

```bash
npm test -- Middleware/__tests__/security.test.js
```

The test suite covers:
- All security headers are set correctly
- CORS allows/blocks origins appropriately
- Credentials support works
- Preflight requests are handled
- Request IDs are generated
- Environment configuration works

## Troubleshooting

### CORS Errors

**Problem:** Frontend receives CORS errors

**Solutions:**
1. Check `ALLOWED_ORIGINS` includes your frontend URL
2. Ensure origin matches exactly (including protocol and port)
3. Verify credentials are enabled if sending cookies
4. Check browser console for specific CORS error

### CSP Violations

**Problem:** Resources blocked by Content Security Policy

**Solutions:**
1. Check browser console for CSP violation reports
2. Add legitimate sources to appropriate CSP directives
3. Use nonces for inline scripts instead of `unsafe-inline`
4. Consider using CSP report-only mode during development

### HSTS Issues

**Problem:** Can't access site over HTTP after HSTS is set

**Solution:**
- HSTS forces HTTPS for the specified duration
- Clear browser HSTS cache or wait for max-age to expire
- Use different browser/incognito mode for testing

## Requirements Satisfied

This implementation satisfies the following requirements:

- **8.3**: Security headers configured (X-Content-Type-Options, X-Frame-Options, X-XSS-Protection, Strict-Transport-Security, Content-Security-Policy)
- **8.4**: HTTPS/TLS enforcement through HSTS
- **8.8**: Helmet.js configured with all recommended security headers
- **8.9**: CORS configured with specific allowed origins from environment variables

## Additional Resources

- [Helmet.js Documentation](https://helmetjs.github.io/)
- [CORS Documentation](https://github.com/expressjs/cors)
- [OWASP Security Headers](https://owasp.org/www-project-secure-headers/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
