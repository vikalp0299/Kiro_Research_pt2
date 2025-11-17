const {
  AppError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  InternalServerError,
  asyncHandler
} = require('../errors');

describe('Custom Error Classes', () => {
  describe('AppError', () => {
    test('should create error with message and status code', () => {
      const error = new AppError('Test error', 400);
      
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Test error');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('AppError');
      expect(error.stack).toBeDefined();
    });

    test('should capture stack trace', () => {
      const error = new AppError('Stack test', 500);
      
      expect(error.stack).toBeDefined();
      expect(error.stack).toContain('AppError');
    });
  });

  describe('ValidationError', () => {
    test('should create validation error with default message', () => {
      const error = new ValidationError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Validation failed');
      expect(error.statusCode).toBe(400);
      expect(error.name).toBe('ValidationError');
    });

    test('should create validation error with custom message', () => {
      const error = new ValidationError('Invalid email format');
      
      expect(error.message).toBe('Invalid email format');
      expect(error.statusCode).toBe(400);
    });

    test('should include validation details', () => {
      const details = {
        email: 'Invalid format',
        password: 'Too short'
      };
      const error = new ValidationError('Validation failed', details);
      
      expect(error.details).toEqual(details);
    });
  });

  describe('UnauthorizedError', () => {
    test('should create unauthorized error with default message', () => {
      const error = new UnauthorizedError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Authentication required');
      expect(error.statusCode).toBe(401);
      expect(error.name).toBe('UnauthorizedError');
    });

    test('should create unauthorized error with custom message', () => {
      const error = new UnauthorizedError('Invalid token');
      
      expect(error.message).toBe('Invalid token');
      expect(error.statusCode).toBe(401);
    });
  });

  describe('ForbiddenError', () => {
    test('should create forbidden error with default message', () => {
      const error = new ForbiddenError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Insufficient permissions');
      expect(error.statusCode).toBe(403);
      expect(error.name).toBe('ForbiddenError');
    });

    test('should create forbidden error with custom message', () => {
      const error = new ForbiddenError('Admin access required');
      
      expect(error.message).toBe('Admin access required');
      expect(error.statusCode).toBe(403);
    });
  });

  describe('NotFoundError', () => {
    test('should create not found error with default message', () => {
      const error = new NotFoundError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource not found');
      expect(error.statusCode).toBe(404);
      expect(error.name).toBe('NotFoundError');
    });

    test('should create not found error with custom message', () => {
      const error = new NotFoundError('User not found');
      
      expect(error.message).toBe('User not found');
      expect(error.statusCode).toBe(404);
    });
  });

  describe('ConflictError', () => {
    test('should create conflict error with default message', () => {
      const error = new ConflictError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Resource conflict');
      expect(error.statusCode).toBe(409);
      expect(error.name).toBe('ConflictError');
    });

    test('should create conflict error with custom message', () => {
      const error = new ConflictError('Username already exists');
      
      expect(error.message).toBe('Username already exists');
      expect(error.statusCode).toBe(409);
    });
  });

  describe('InternalServerError', () => {
    test('should create internal server error with default message', () => {
      const error = new InternalServerError();
      
      expect(error).toBeInstanceOf(AppError);
      expect(error.message).toBe('Internal server error');
      expect(error.statusCode).toBe(500);
      expect(error.name).toBe('InternalServerError');
    });

    test('should create internal server error with custom message', () => {
      const error = new InternalServerError('Database connection failed');
      
      expect(error.message).toBe('Database connection failed');
      expect(error.statusCode).toBe(500);
    });
  });

  describe('asyncHandler', () => {
    test('should wrap async function and catch errors', async () => {
      const asyncFn = async (req, res, next) => {
        throw new Error('Async error');
      };

      const wrapped = asyncHandler(asyncFn);
      const next = jest.fn();

      await wrapped({}, {}, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(Error);
      expect(next.mock.calls[0][0].message).toBe('Async error');
    });

    test('should pass through successful async functions', async () => {
      const asyncFn = async (req, res, next) => {
        res.json({ success: true });
      };

      const wrapped = asyncHandler(asyncFn);
      const res = {
        json: jest.fn()
      };
      const next = jest.fn();

      await wrapped({}, res, next);

      expect(res.json).toHaveBeenCalledWith({ success: true });
      expect(next).not.toHaveBeenCalled();
    });

    test('should handle rejected promises', async () => {
      const asyncFn = jest.fn().mockRejectedValue(new ValidationError('Invalid input'));

      const wrapped = asyncHandler(asyncFn);
      const next = jest.fn();

      await wrapped({}, {}, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(ValidationError);
      expect(next.mock.calls[0][0].message).toBe('Invalid input');
    });

    test('should handle synchronous errors in async functions', async () => {
      const asyncFn = async (req, res, next) => {
        throw new NotFoundError('Resource not found');
      };

      const wrapped = asyncHandler(asyncFn);
      const next = jest.fn();

      await wrapped({}, {}, next);

      expect(next).toHaveBeenCalled();
      expect(next.mock.calls[0][0]).toBeInstanceOf(NotFoundError);
    });
  });
});

describe('Error Handling Integration', () => {
  const express = require('express');
  const request = require('supertest');

  test('should handle validation errors with 400 status', async () => {
    const app = express();
    
    app.get('/test', (req, res, next) => {
      next(new ValidationError('Invalid input'));
    });

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message
      });
    });

    const response = await request(app)
      .get('/test')
      .expect(400);

    expect(response.body).toHaveProperty('error', 'Invalid input');
  });

  test('should handle unauthorized errors with 401 status', async () => {
    const app = express();
    
    app.get('/test', (req, res, next) => {
      next(new UnauthorizedError('Token expired'));
    });

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message
      });
    });

    const response = await request(app)
      .get('/test')
      .expect(401);

    expect(response.body).toHaveProperty('error', 'Token expired');
  });

  test('should handle not found errors with 404 status', async () => {
    const app = express();
    
    app.get('/test', (req, res, next) => {
      next(new NotFoundError('User not found'));
    });

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message
      });
    });

    const response = await request(app)
      .get('/test')
      .expect(404);

    expect(response.body).toHaveProperty('error', 'User not found');
  });

  test('should handle conflict errors with 409 status', async () => {
    const app = express();
    
    app.get('/test', (req, res, next) => {
      next(new ConflictError('Email already exists'));
    });

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message
      });
    });

    const response = await request(app)
      .get('/test')
      .expect(409);

    expect(response.body).toHaveProperty('error', 'Email already exists');
  });

  test('should handle generic errors with 500 status', async () => {
    const app = express();
    
    app.get('/test', (req, res, next) => {
      next(new Error('Unexpected error'));
    });

    app.use((err, req, res, next) => {
      res.status(err.statusCode || 500).json({
        error: err.message
      });
    });

    const response = await request(app)
      .get('/test')
      .expect(500);

    expect(response.body).toHaveProperty('error', 'Unexpected error');
  });
});
