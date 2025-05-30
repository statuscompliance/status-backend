import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';
import winston from 'winston';

// Mock mongoose with a structure similar to clean-logs.test.js
vi.mock('mongoose', () => {
  const mockDeleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 });
  const mockCreate = vi.fn().mockResolvedValue({});
  const mockModel = vi.fn().mockReturnValue({
    create: mockCreate,
    deleteMany: mockDeleteMany
  });
  
  return {
    Schema: vi.fn(),
    model: vi.fn().mockImplementation((name) => {
      if (name === 'Log' && !vi.isMockFunction(name)) {
        throw new Error('Model not registered');
      }
      return mockModel();
    }),
    createConnection: vi.fn().mockReturnValue({
      model: mockModel
    }),
    connection: {
      close: vi.fn().mockResolvedValue({}),
      readyState: 1
    },
    connect: vi.fn().mockResolvedValue({})
  };
});

import logger, { requestLogger, logError, initLogDB } from '../../../src/config/logger.js';

describe('Logger Module', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });
  
  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('logger instance', () => {
    it('should be a winston logger instance', () => {
      expect(logger).toBeDefined();
      expect(logger.info).toBeTypeOf('function');
      expect(logger.error).toBeTypeOf('function');
      expect(logger.warn).toBeTypeOf('function');
      expect(logger.http).toBeTypeOf('function');
      expect(logger.debug).toBeTypeOf('function');
      expect(logger.database).toBeTypeOf('function');
    });

    it('should have correct log levels', () => {
      const levels = Object.keys(logger.levels);
      expect(levels).toContain('error');
      expect(levels).toContain('warn');
      expect(levels).toContain('info');
      expect(levels).toContain('http');
      expect(levels).toContain('debug');
      expect(levels).toContain('database');
    });

    it('should have database level with correct priority', () => {
      // Database should have higher number than other levels
      expect(logger.levels.database).toBeGreaterThan(logger.levels.error);
      expect(logger.levels.database).toBeGreaterThan(logger.levels.warn);
      expect(logger.levels.database).toBeGreaterThan(logger.levels.info);
      expect(logger.levels.database).toBeGreaterThan(logger.levels.http);
      expect(logger.levels.database).toBeGreaterThan(logger.levels.debug);
    });

    it('should have console transport', () => {
      const transports = logger.transports;
      const hasConsoleTransport = transports.some(t => t instanceof winston.transports.Console);
      expect(hasConsoleTransport).toBe(true);
    });
  });

  describe('database logging', () => {
    it('should log database operations correctly', () => {
      vi.spyOn(logger, 'database').mockImplementation(() => {});
      
      logger.database('Connected to MongoDB', {
        uri: 'mongodb://localhost:27017',
        database: 'test_db',
        host: 'localhost:27017'
      });

      expect(logger.database).toHaveBeenCalledWith(
        'Connected to MongoDB',
        expect.objectContaining({
          uri: 'mongodb://localhost:27017',
          database: 'test_db',
          host: 'localhost:27017'
        })
      );
    });
  });

  describe('requestLogger middleware', () => {
    it('should add requestId to req object and call next', () => {
      const req = {
        method: 'GET',
        originalUrl: '/test',
        headers: {},
        ip: '127.0.0.1'
      };
      
      const res = {
        on: vi.fn(),
        statusCode: 200
      };
      
      const next = vi.fn();
      
      requestLogger(req, res, next);
      expect(next).toHaveBeenCalled();
      expect(res.on).toHaveBeenCalledWith('finish', expect.any(Function));
    });

    it('should log HTTP request on finish with http level for success responses', () => {
      vi.spyOn(logger, 'http').mockImplementation(() => {});
      
      const req = {
        method: 'GET',
        originalUrl: '/test',
        headers: { 'user-agent': 'test-agent' },
        ip: '127.0.0.1'
      };
      
      const res = {
        on: vi.fn(),
        statusCode: 200
      };
      
      const next = vi.fn();

      requestLogger(req, res, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(logger.http).toHaveBeenCalledWith('GET /test', expect.objectContaining({
        userId: 'anonymous',
        ip: '127.0.0.1',
        method: 'GET',
        statusCode: 200,
        userAgent: 'test-agent'
      }));
    });

    it('should log HTTP request on finish with warn level for error responses', () => {
      vi.spyOn(logger, 'warn').mockImplementation(() => {});
      
      const req = {
        method: 'POST',
        originalUrl: '/test',
        headers: {},
        ip: '127.0.0.1',
        user: { id: 'user123' }
      };
      
      const res = {
        on: vi.fn(),
        statusCode: 400
      };
      
      const next = vi.fn();
      
      requestLogger(req, res, next);

      const finishCallback = res.on.mock.calls[0][1];
      finishCallback();

      expect(logger.warn).toHaveBeenCalledWith('POST /test', expect.objectContaining({
        userId: 'user123',
        ip: '127.0.0.1',
        method: 'POST',
        statusCode: 400
      }));
    });
  });

  describe('logError function', () => {
    it('should log errors with stack trace', () => {
      vi.spyOn(logger, 'error').mockImplementation(() => {});
      
      const error = new Error('Test error');
      const requestInfo = {
        requestId: 'req-123',
        userId: 'user-456',
        url: '/test/url'
      };

      logError(error, requestInfo);

      expect(logger.error).toHaveBeenCalledWith(
        'Error: Test error',
        expect.objectContaining({
          requestId: 'req-123',
          userId: 'user-456',
          url: '/test/url',
          stack: error.stack,
          message: 'Test error'
        })
      );
    });

    it('should log errors without request info', () => {
      vi.spyOn(logger, 'error').mockImplementation(() => {});
      
      const error = new Error('Simple error');

      logError(error);

      expect(logger.error).toHaveBeenCalledWith(
        'Error: Simple error',
        expect.objectContaining({
          stack: error.stack,
          message: 'Simple error'
        })
      );
    });
  });

  describe('initLogDB function', () => {
    it('should skip MongoDB connection in test environment', async () => {
      vi.spyOn(logger, 'info').mockImplementation(() => {});

      const result = await initLogDB();

      expect(result).toBeNull();
      expect(logger.info).toHaveBeenCalledWith('Test environment detected - skipping MongoDB logger initialization');
    });
  });
});
