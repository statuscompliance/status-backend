import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { associateModels } from '../../../src/db/model-utils.js';

describe('Model Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('associateModels', () => {
    it('should successfully associate models with associate methods', async () => {
      const mockModel1 = vi.fn();
      mockModel1.associate = vi.fn().mockResolvedValue(undefined);
      
      const mockModel2 = vi.fn();
      mockModel2.associate = vi.fn().mockResolvedValue(undefined);

      const models = {
        User: mockModel1,
        Point: mockModel2
      };

      await associateModels(models);

      expect(mockModel1.associate).toHaveBeenCalledWith(models);
      expect(mockModel2.associate).toHaveBeenCalledWith(models);
    });

    it('should skip models without associate method', async () => {
      const mockModel1 = vi.fn();
      mockModel1.associate = vi.fn().mockResolvedValue(undefined);
      
      const mockModel2 = vi.fn();
      // No associate method

      const models = {
        User: mockModel1,
        Point: mockModel2
      };

      await associateModels(models);

      expect(mockModel1.associate).toHaveBeenCalledWith(models);
      // mockModel2.associate should not exist, so no call should be made
    });

    it('should handle models with non-function associate property', async () => {
      const mockModel1 = vi.fn();
      mockModel1.associate = 'not-a-function';
      
      const mockModel2 = vi.fn();
      mockModel2.associate = vi.fn().mockResolvedValue(undefined);

      const models = {
        User: mockModel1,
        Point: mockModel2
      };

      await associateModels(models);

      // Only mockModel2.associate should be called
      expect(mockModel2.associate).toHaveBeenCalledWith(models);
    });

    it('should throw error for invalid models object - null', async () => {
      await expect(associateModels(null)).rejects.toThrow('Invalid models object');
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid models object - not an object', async () => {
      await expect(associateModels('not-an-object')).rejects.toThrow('Invalid models object');
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid models object - undefined', async () => {
      await expect(associateModels(undefined)).rejects.toThrow('Invalid models object');
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid model name - empty string', async () => {
      const mockModel = vi.fn();
      const models = {
        '': mockModel
      };

      await expect(associateModels(models)).rejects.toThrow('Invalid modelName detected');
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid model name - whitespace only', async () => {
      const mockModel = vi.fn();
      const models = {
        '   ': mockModel
      };

      await expect(associateModels(models)).rejects.toThrow('Invalid modelName detected');
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid model type - not a function', async () => {
      const models = {
        User: 'not-a-function'
      };

      await expect(associateModels(models)).rejects.toThrow("Invalid model type for 'User'");
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid model type - null', async () => {
      const models = {
        User: null
      };

      await expect(associateModels(models)).rejects.toThrow("Invalid model type for 'User'");
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should throw error for invalid model type - object', async () => {
      const models = {
        User: {}
      };

      await expect(associateModels(models)).rejects.toThrow("Invalid model type for 'User'");
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should handle errors thrown by associate method', async () => {
      const associateError = new Error('Association failed');
      const mockModel = vi.fn();
      mockModel.associate = vi.fn().mockRejectedValue(associateError);

      const models = {
        User: mockModel
      };

      await expect(associateModels(models)).rejects.toThrow('Association failed');
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', associateError);
    });

    it('should process multiple models and call associate methods in order', async () => {
      const mockModel1 = vi.fn();
      mockModel1.associate = vi.fn().mockResolvedValue(undefined);
      
      const mockModel2 = vi.fn();
      mockModel2.associate = vi.fn().mockResolvedValue(undefined);
      
      const mockModel3 = vi.fn();
      mockModel3.associate = vi.fn().mockResolvedValue(undefined);

      const models = {
        User: mockModel1,
        Point: mockModel2,
        Configuration: mockModel3
      };

      await associateModels(models);

      expect(mockModel1.associate).toHaveBeenCalledWith(models);
      expect(mockModel2.associate).toHaveBeenCalledWith(models);
      expect(mockModel3.associate).toHaveBeenCalledWith(models);
    });

    it('should handle empty models object', async () => {
      const models = {};

      await expect(associateModels(models)).resolves.toBeUndefined();
      // No errors should be thrown for empty object
    });

    it('should handle models object with mix of valid and invalid models', async () => {
      const mockModel1 = vi.fn();
      mockModel1.associate = vi.fn().mockResolvedValue(undefined);

      const models = {
        User: mockModel1,
        Invalid: 'not-a-function'
      };

      await expect(associateModels(models)).rejects.toThrow("Invalid model type for 'Invalid'");
      expect(console.error).toHaveBeenCalledWith('Error processing model associations:', expect.any(Error));
    });

    it('should handle model with associate method that returns non-promise', async () => {
      const mockModel = vi.fn();
      mockModel.associate = vi.fn().mockReturnValue('not-a-promise');

      const models = {
        User: mockModel
      };

      // Should still work since we await the result
      await associateModels(models);
      expect(mockModel.associate).toHaveBeenCalledWith(models);
    });

    it('should pass the correct models object to each associate method', async () => {
      const mockModel1 = vi.fn();
      mockModel1.associate = vi.fn().mockResolvedValue(undefined);
      
      const mockModel2 = vi.fn();
      mockModel2.associate = vi.fn().mockResolvedValue(undefined);

      const models = {
        User: mockModel1,
        Point: mockModel2
      };

      await associateModels(models);

      expect(mockModel1.associate).toHaveBeenCalledWith(models);
      expect(mockModel2.associate).toHaveBeenCalledWith(models);
      
      // Verify the exact same object reference is passed
      expect(mockModel1.associate.mock.calls[0][0]).toBe(models);
      expect(mockModel2.associate.mock.calls[0][0]).toBe(models);
    });
  });
});
