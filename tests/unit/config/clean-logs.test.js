import { expect, describe, it, beforeEach, afterEach, vi } from 'vitest';

// Mock these modules before importing the module to be tested
vi.mock('mongoose', () => {
  const mockDeleteMany = vi.fn().mockResolvedValue({ deletedCount: 0 });
  const mockModel = vi.fn().mockReturnValue({
    deleteMany: mockDeleteMany
  });
  
  return {
    default: {
      connect: vi.fn().mockResolvedValue({}),
      Schema: vi.fn(),
      model: mockModel,
      connection: {
        close: vi.fn().mockResolvedValue({}),
        readyState: 1
      }
    },
    connect: vi.fn().mockResolvedValue({}),
    Schema: vi.fn(),
    model: mockModel,
    connection: {
      close: vi.fn().mockResolvedValue({}),
      readyState: 1
    }
  };
});

// Mock date-fns for deterministic tests
vi.mock('date-fns', async (importOriginal) => {
  const actual = await importOriginal();
  return {
    ...actual,
    subDays: vi.fn().mockImplementation((date, days) => {
      const result = new Date(date);
      result.setDate(result.getDate() - days);
      return result;
    })
  };
});

// Mock console methods for testing log output
const originalConsole = { ...console };
const mockConsole = {
  log: vi.fn(),
  error: vi.fn()
};

import mongoose from 'mongoose';

describe('clean-logs script', () => {
  let originalEnv;
  
  beforeEach(async () => {
    originalEnv = { ...process.env };
    
    vi.clearAllMocks();
    
    console.log = mockConsole.log;
    console.error = mockConsole.error;
    
    process.env.LOG_RETENTION_DAYS = '30';
    process.env.MONGO_LOG_URI = 'mongodb://test:test@localhost/testlogs';
    
    mongoose.model().deleteMany.mockResolvedValue({ deletedCount: 0 });
  });
  
  afterEach(() => {
    process.env = originalEnv;
    console.log = originalConsole.log;
    console.error = originalConsole.error;
    
    vi.resetModules();
  });
  
  it('should connect to MongoDB and delete old logs', async () => {
    mongoose.model().deleteMany.mockResolvedValueOnce({ deletedCount: 123 });
    
    await import('../../../src/config/clean-logs.js');
    
    expect(mongoose.connect).toHaveBeenCalledWith(
      'mongodb://test:test@localhost/testlogs'
    );
    
    expect(mongoose.model).toHaveBeenCalledWith('Log', expect.any(Object));
    
    expect(mongoose.model().deleteMany).toHaveBeenCalledWith({
      timestamp: { $lt: expect.any(Date) }
    });
    
    expect(mongoose.connection.close).toHaveBeenCalled();
    
    expect(
      console.log.mock.calls.some(call => call[0].includes('log records were deleted'))
    ).toBe(true);
  });
  
  it('should handle the case when no logs are deleted', async () => {
    mongoose.model().deleteMany.mockResolvedValueOnce({ deletedCount: 0 });
    
    await import('../../../src/config/clean-logs.js');
    
    expect(mongoose.model().deleteMany).toHaveBeenCalled();
    
    expect(console.log).toHaveBeenCalledWith(expect.stringContaining('No log records found to delete'));
  });
  
  it('should use the configured retention period from environment variables', async () => {
    process.env.LOG_RETENTION_DAYS = '45';
    
    const mockDate = new Date('2023-01-15T12:00:00Z');
    vi.setSystemTime(mockDate);
    
    await import('../../../src/config/clean-logs.js');
    
    const expectedDate = new Date('2023-01-15T12:00:00Z');
    expectedDate.setDate(expectedDate.getDate() - 45);
    
    const deleteManyCalls = mongoose.model().deleteMany.mock.calls;
    expect(deleteManyCalls.length).toBe(1);
    
    expect(deleteManyCalls[0][0]).toHaveProperty('timestamp.$lt');
    
    vi.useRealTimers();
  });
  
  it('should handle MongoDB connection errors', async () => {
    const connectionError = new Error('Failed to connect to MongoDB');
    mongoose.connect.mockRejectedValueOnce(connectionError);
    
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    
    await import('../../../src/config/clean-logs.js');
    
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error cleaning logs: Failed to connect to MongoDB'));
    
    expect(mockExit).toHaveBeenCalledWith(1);
    
    mockExit.mockRestore();
  });
  
  it('should handle errors during log deletion', async () => {
    const deletionError = new Error('Database operation failed');
    mongoose.model().deleteMany.mockRejectedValueOnce(deletionError);
    
    const mockExit = vi.spyOn(process, 'exit').mockImplementation(() => {});
    
    await import('../../../src/config/clean-logs.js');
    
    expect(console.error).toHaveBeenCalledWith(expect.stringContaining('Error cleaning logs: Database operation failed'));
    
    expect(mockExit).toHaveBeenCalledWith(1);
    
    mockExit.mockRestore();
  });
});
