const express = require('express');
const request = require('supertest');
const { applySecurityMiddleware, configureHelmet, configureCORS } = require('../security');

describe('Security Middleware', () => {
  let app;

  beforeEach(() => {
    app = express();
    // Set test environment variables
    process.env.ALLOWED_ORIGINS = 'http://localhost:3000,http://localhost:3001';
  });

  afterEach(() => {
    delete process.env.ALLOWED_ORIGINS;
  });

  describe('Helmet Security Headers', () => {
    beforeEach(() => {
      app.use(configureHelmet());
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    test('should set X-Content-Type-Options header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-content-type-options']).toBe('nosniff');
    });

    test('should set X-Frame-Options header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-frame-options']).toBe('DENY');
    });

    test('should set Strict-Transport-Security header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['strict-transport-security']).toContain('max-age=31536000');
      expect(response.headers['strict-transport-security']).toContain('includeSubDomains');
    });

    test('should set Content-Security-Policy header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['content-security-policy']).toBeDefined();
      expect(response.headers['content-security-policy']).toContain("default-src 'self'");
    });

    test('should set X-XSS-Protection header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-xss-protection']).toBeDefined();
    });

    test('should remove X-Powered-By header', async () => {
      const response = await request(app).get('/test');
      expect(response.headers['x-powered-by']).toBeUndefined();
    });
  });

  describe('CORS Configuration', () => {
    beforeEach(() => {
      app.use(configureCORS());
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    test('should allow requests from allowed origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.status).toBe(200);
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
    });

    test('should allow credentials', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      expect(response.headers['access-control-allow-credentials']).toBe('true');
    });

    test('should reject requests from non-allowed origins', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://malicious-site.com');
      
      // CORS middleware will not set the allow-origin header for disallowed origins
      expect(response.headers['access-control-allow-origin']).toBeUndefined();
    });

    test('should handle preflight OPTIONS requests', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'POST');
      
      expect(response.status).toBe(204);
      expect(response.headers['access-control-allow-methods']).toContain('POST');
    });

    test('should allow specified HTTP methods', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Method', 'DELETE');
      
      expect(response.headers['access-control-allow-methods']).toContain('DELETE');
      expect(response.headers['access-control-allow-methods']).toContain('GET');
      expect(response.headers['access-control-allow-methods']).toContain('POST');
      expect(response.headers['access-control-allow-methods']).toContain('PUT');
    });

    test('should allow specified headers', async () => {
      const response = await request(app)
        .options('/test')
        .set('Origin', 'http://localhost:3000')
        .set('Access-Control-Request-Headers', 'Content-Type,Authorization');
      
      expect(response.headers['access-control-allow-headers']).toContain('Content-Type');
      expect(response.headers['access-control-allow-headers']).toContain('Authorization');
    });
  });

  describe('Complete Security Middleware', () => {
    beforeEach(() => {
      applySecurityMiddleware(app);
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });
    });

    test('should apply all security headers', async () => {
      const response = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      
      // Check Helmet headers
      expect(response.headers['x-content-type-options']).toBe('nosniff');
      expect(response.headers['x-frame-options']).toBe('DENY');
      expect(response.headers['strict-transport-security']).toBeDefined();
      expect(response.headers['content-security-policy']).toBeDefined();
      
      // Check CORS headers
      expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
      expect(response.headers['access-control-allow-credentials']).toBe('true');
      
      // Check custom headers
      expect(response.headers['x-request-id']).toBeDefined();
      expect(response.headers['x-powered-by']).toBeUndefined();
    });

    test('should generate unique request IDs', async () => {
      const response1 = await request(app).get('/test');
      const response2 = await request(app).get('/test');
      
      expect(response1.headers['x-request-id']).toBeDefined();
      expect(response2.headers['x-request-id']).toBeDefined();
      expect(response1.headers['x-request-id']).not.toBe(response2.headers['x-request-id']);
    });
  });

  describe('Environment Configuration', () => {
    test('should use default origin when ALLOWED_ORIGINS is not set', () => {
      delete process.env.ALLOWED_ORIGINS;
      
      const app = express();
      app.use(configureCORS());
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      return request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000')
        .then(response => {
          expect(response.headers['access-control-allow-origin']).toBe('http://localhost:3000');
        });
    });

    test('should handle multiple origins from environment variable', async () => {
      process.env.ALLOWED_ORIGINS = 'http://localhost:3000, http://localhost:3001, https://example.com';
      
      const app = express();
      app.use(configureCORS());
      app.get('/test', (req, res) => {
        res.json({ message: 'test' });
      });

      // Test first origin
      const response1 = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3000');
      expect(response1.headers['access-control-allow-origin']).toBe('http://localhost:3000');

      // Test second origin
      const response2 = await request(app)
        .get('/test')
        .set('Origin', 'http://localhost:3001');
      expect(response2.headers['access-control-allow-origin']).toBe('http://localhost:3001');

      // Test third origin
      const response3 = await request(app)
        .get('/test')
        .set('Origin', 'https://example.com');
      expect(response3.headers['access-control-allow-origin']).toBe('https://example.com');
    });
  });
});
