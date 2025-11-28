import { vi } from 'vitest';

/**
 * Creates a mock Express response object with common methods
 * Used in unit tests to simulate HTTP responses
 * @returns {Object} Mock response object with all common Express response methods
 */
export function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
    sendStatus: vi.fn().mockReturnThis(),
    cookie: vi.fn().mockReturnThis(),
    clearCookie: vi.fn().mockReturnThis(),
  };
}
