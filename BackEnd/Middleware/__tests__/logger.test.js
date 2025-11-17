const { logRequest, logAuthAttempt, logError } = require('../logger');
const fs = require('fs');
const path = require('path');

// Mock console methods to avoid cluttering test output
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

beforeEach(() => {
  console.log = jest.fn();
  console.error = jest.fn();
});

afterEach(() => {
  console.log = originalConsoleLog;
  console.error = originalConsoleError;
});

describe('Logger Middleware', () => {
  describe('logRequest', () => {
    it('should log request details and call next', () => {
      const req = {
        method: 'GET',
        path: '/api/test',
        headers: {},
        connection: { remoteAddress: '127.0.0.1' }
      };
      
      const res = {
        statusCode: 200,
        json: jest.fn(function(data) {
          return this;
        }),
        send: jest.fn(function(data) {
          return this;
        }),
        on: jest.fn()
      };
      
      const next = jest.fn();
      
      logRequest(req, res, next);
      
      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log response when res.json is called', () => {
      const req = {
        method: 'POST',
        path: '/api/login',
        headers: {},
        connection: { remoteAddress: '192.168.1.1' }
      };
      
      const res = {
        statusCode: 201,
        json: jest.fn(function(data) {
          return this;
        }),
        send: jest.fn(function(data) {
          return this;
        }),
        on: jest.fn()
      };
      
      const next = jest.fn();
      
      logRequest(req, res, next);
      
      // Call the overridden json method
      res.json({ success: true });
      
      expect(console.log).toHaveBeenCalled();
      const logOutput = console.log.mock.calls[0][0];
      expect(logOutput).toContain('POST');
      expect(logOutput).toContain('/api/login');
    });

    it('should extract IP from x-forwarded-for header', () => {
      const req = {
        method: 'GET',
        path: '/api/test',
        headers: {
          'x-forwarded-for': '203.0.113.1, 198.51.100.1'
        },
        connection: { remoteAddress: '127.0.0.1' }
      };
      
      const res = {
        statusCode: 200,
        json: jest.fn(function(data) {
          return this;
        }),
        send: jest.fn(function(data) {
          return this;
        }),
        on: jest.fn()
      };
      
      const next = jest.fn();
      
      logRequest(req, res, next);
      res.json({ data: 'test' });
      
      const logOutput = console.log.mock.calls[0][0];
      expect(logOutput).toContain('203.0.113.1');
    });
  });

  describe('logAuthAttempt', () => {
    it('should log successful authentication attempt', () => {
      logAuthAttempt('testuser', true, '127.0.0.1');
      
      expect(console.log).toHaveBeenCalled();
      const logOutput = console.log.mock.calls[0][0];
      expect(logOutput).toContain('AUTH');
      expect(logOutput).toContain('SUCCESS');
      expect(logOutput).toContain('testuser');
    });

    it('should log failed authentication attempt', () => {
      logAuthAttempt('testuser', false, '192.168.1.1');
      
      expect(console.log).toHaveBeenCalled();
      const logOutput = console.log.mock.calls[0][0];
      expect(logOutput).toContain('AUTH');
      expect(logOutput).toContain('FAILED');
      expect(logOutput).toContain('testuser');
    });

    it('should include additional info in log entry', () => {
      const additionalInfo = {
        reason: 'invalid_password',
        attemptCount: 3
      };
      
      logAuthAttempt('testuser', false, '127.0.0.1', additionalInfo);
      
      expect(console.log).toHaveBeenCalled();
    });
  });

  describe('logError', () => {
    it('should log error with message', () => {
      const error = new Error('Test error message');
      
      logError(error);
      
      expect(console.error).toHaveBeenCalled();
      const logOutput = console.error.mock.calls[0][0];
      expect(logOutput).toContain('ERROR');
      expect(logOutput).toContain('Test error message');
    });

    it('should log error with context', () => {
      const error = new Error('Database connection failed');
      const context = {
        method: 'POST',
        path: '/api/users',
        userId: 12345,
        ip: '127.0.0.1'
      };
      
      logError(error, context);
      
      expect(console.error).toHaveBeenCalled();
      expect(console.error.mock.calls.length).toBeGreaterThan(1);
      
      const errorOutput = console.error.mock.calls.map(call => call[0]).join(' ');
      expect(errorOutput).toContain('Database connection failed');
      expect(errorOutput).toContain('POST');
      expect(errorOutput).toContain('/api/users');
    });

    it('should include stack trace in log entry', () => {
      const error = new Error('Stack trace test');
      error.stack = 'Error: Stack trace test\n    at test.js:10:15';
      
      logError(error, { method: 'GET', path: '/test' });
      
      expect(console.error).toHaveBeenCalled();
    });
  });
});
