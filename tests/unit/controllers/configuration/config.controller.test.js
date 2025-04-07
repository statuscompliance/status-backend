import { describe, it, expect, vi , beforeEach} from 'vitest';
import * as configurationController from '../../../../src/controllers/configuration.controller';
import { models } from '../../../../src/models/models';

vi.mock('../../../../src/models/models', () => ({
  models: {
    Configuration: {
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    },
    Assistant: {
      findAll: vi.fn(),
    },
  },
}));

const createRes = () => {
  const res = {};
  res.status = vi.fn(() => res);
  res.json = vi.fn();
  return res;
};

describe('getConfiguration', () => {
  let mockReq;
  let res;
  
  beforeEach(() => {
    mockReq = {};
    res = createRes();
    vi.clearAllMocks();
  });
  
  it('should respond with configurations and status 200 on success', async () => {
    const mockConfigurations = [{ id: 1, endpoint: '/api/users' }];
    vi.spyOn(models.Configuration, 'findAll').mockResolvedValue(mockConfigurations);
  
    await configurationController.getConfiguration(mockReq, res);
  
    expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockConfigurations);
  });
  
  it('should respond with status 500 on error', async () => {
    const mockError = new Error('Database error');
    vi.spyOn(models.Configuration, 'findAll').mockRejectedValue(mockError);
  
    await configurationController.getConfiguration(mockReq, res);
  
    expect(models.Configuration.findAll).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: `Failed to get configuration, error: ${mockError.message}`,
    });
  });
});
