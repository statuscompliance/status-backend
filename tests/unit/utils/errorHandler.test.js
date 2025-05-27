import { expect, describe, it, beforeEach, vi } from 'vitest';
import { handleControllerError } from '../../../src/utils/errorHandler';

describe('handleControllerError', () => {
  let res;
  
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis()
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
          error: 'Resource not found'
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
          error: 'Access denied'
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
          error: 'Internal server error in external service'
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
          error: 'Bad request parameters'
        },
        testName: 'should handle external error without status text and data message'
      }
    ])('$testName', ({ error, defaultMessage, expectedStatus, expectedJson }) => {
      handleControllerError(res, error, defaultMessage);
      
      expect(res.status).toHaveBeenCalledWith(expectedStatus);
      expect(res.json).toHaveBeenCalledWith(expectedJson);
    });
  });

  describe('Tests for internal errors (without response property)', () => {
    it.each([
      {
        error: new Error('Database connection failed'),
        defaultMessage: 'Database Error',
        expectedJson: {
          message: 'Database Error',
          error: 'Database connection failed'
        },
        testName: 'should handle internal error with custom message'
      },
      {
        error: new Error('Runtime exception'),
        defaultMessage: undefined,
        expectedJson: {
          message: 'Internal server error',
          error: 'Runtime exception'
        },
        testName: 'should use default message when none is provided'
      },
      {
        error: { message: 'Custom error object' },
        defaultMessage: 'Validation Error',
        expectedJson: {
          message: 'Validation Error',
          error: 'Custom error object'
        },
        testName: 'should handle plain object with message property'
      }
    ])('$testName', ({ error, defaultMessage, expectedJson }) => {
      handleControllerError(res, error, defaultMessage);
      
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith(expectedJson);
    });
  });

  it('should return the response object for chaining', () => {
    const result = handleControllerError(res, new Error('Test error'));
    expect(result).toBe(res);
  });
});
