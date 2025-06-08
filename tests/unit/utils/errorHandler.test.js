import { expect, describe, it, beforeEach, vi } from 'vitest';
import { handleControllerError } from '../../../src/utils/errorHandler';
import * as logger from '../../../src/config/logger.js';

describe('handleControllerError', () => {
  let res;
  
  beforeEach(() => {
    vi.spyOn(logger, 'logError').mockImplementation(() => {});
    
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      req: {
        requestId: 'test-request-id',
        user: { id: 'test-user-id' },
        ip: '127.0.0.1',
        originalUrl: '/api/test',
        method: 'GET'
      }
    };
  });

  describe('Tests for external HTTP errors (with response property)', () => {
    it.each([
      {
        error: { 
          response: { 
            status: 404, 
            statusText: 'Not Found', 
            data: { message: 'Resource not found' } 
          },
          message: 'Error occurred'
        },
        defaultMessage: 'API Error',
        expectedStatus: 404,
        expectedJson: {
          message: 'API Error: Not Found',
          error: 'Resource not found',
          requestId: 'test-request-id'
        },
        testName: 'should handle external error with status text and data message'
      },
      {
        error: { 
          response: { 
            status: 403, 
            statusText: 'Forbidden', 
            data: {} 
          },
          message: 'Access denied'
        },
        defaultMessage: 'Authorization Error',
        expectedStatus: 403,
        expectedJson: {
          message: 'Authorization Error: Forbidden',
          error: 'Access denied',
          requestId: 'test-request-id'
        },
        testName: 'should handle external error with status text but no data message'
      },
      {
        error: { 
          response: { 
            status: 500, 
            data: { message: 'Internal server error in external service' } 
          },
          message: 'Server error'
        },
        defaultMessage: 'Service Error',
        expectedStatus: 500,
        expectedJson: {
          message: 'Service Error',
          error: 'Internal server error in external service',
          requestId: 'test-request-id'
        },
        testName: 'should handle external error without status text but with data message'
      },
      {
        error: { 
          response: { 
            status: 400, 
            data: {} 
          },
          message: 'Bad request parameters'
        },
        defaultMessage: 'Request Error',
        expectedStatus: 400,
        expectedJson: {
          message: 'Request Error',
          error: 'Bad request parameters',
          requestId: 'test-request-id'
        },
        testName: 'should handle external error without status text and data message'
      }
    ])('$testName', ({ error, defaultMessage, expectedStatus, expectedJson }) => {
      handleControllerError(res, error, defaultMessage);
      
      expect(res.status).toHaveBeenCalledWith(expectedStatus);
      expect(res.json).toHaveBeenCalledWith(expectedJson);
      expect(logger.logError).toHaveBeenCalledWith(error, expect.objectContaining({
        requestId: 'test-request-id',
        userId: 'test-user-id',
        ip: '127.0.0.1',
        url: '/api/test',
        method: 'GET'
      }));
    });
  });

  describe('Tests for internal errors (without response property)', () => {
    it.each([
      {
        error: new Error('Database connection failed'),
        defaultMessage: 'Database Error',
        expectedJson: {
          message: 'Database Error',
          error: 'Database connection failed',
          requestId: 'test-request-id'
        },
        testName: 'should handle internal error with custom message'
      },
      {
        error: new Error('Runtime exception'),
        defaultMessage: undefined,
        expectedJson: {
          message: 'Internal server error',
          error: 'Runtime exception',
          requestId: 'test-request-id'
        },
        testName: 'should use default message when none is provided'
      },
      {
        error: { message: 'Custom error object' },
        defaultMessage: 'Validation Error',
        expectedJson: {
          message: 'Validation Error',
          error: 'Custom error object',
          requestId: 'test-request-id'
        },
        testName: 'should handle plain object with message property'
      }
    ])('$testName', ({ error, defaultMessage, expectedJson }) => {
      handleControllerError(res, error, defaultMessage);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expectedJson);
      expect(logger.logError).toHaveBeenCalledWith(error, expect.any(Object));
    });
  });

  it('should return the response object for chaining', () => {
    const result = handleControllerError(res, new Error('Test error'));
    expect(result).toBe(res);
  });

  it('should handle missing req object gracefully', () => {
    const resNoReq = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
    };
    
    const error = new Error('Test error');
    handleControllerError(resNoReq, error);
    
    expect(resNoReq.status).toHaveBeenCalledWith(500);
    expect(resNoReq.json).toHaveBeenCalledWith({
      message: 'Internal server error',
      error: 'Test error',
      requestId: undefined
    });
    expect(logger.logError).toHaveBeenCalledWith(error, expect.objectContaining({
      requestId: undefined,
      userId: 'anonymous'
    }));
  });
});
