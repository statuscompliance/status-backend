import { describe, it, expect, beforeEach, vi, beforeAll } from 'vitest';
import nodered from '../../../src/config/nodered.js';
import { getNodeRedToken } from '../../../src/utils/nodeRedToken.js';

beforeAll(() => {
  vi.spyOn(console, 'error').mockImplementation(() => {});
});

describe('getNodeRedToken', () => {
  const username = 'user1';
  const password = 'pass123';
  
  // Create a spy on nodered's post method
  const postSpy = vi.spyOn(nodered, 'post');

  beforeEach(() => {
    // Reset the spy before each test
    postSpy.mockReset();
  });

  it('returns access_token on success', async () => {
    const token = 'abc123';
    postSpy.mockResolvedValueOnce({ data: { access_token: token } });

    const result = await getNodeRedToken(username, password);

    expect(result).toBe(token);
    expect(postSpy).toHaveBeenCalledOnce();
    expect(postSpy).toHaveBeenCalledWith('/auth/token', {
      client_id: 'node-red-admin',
      grant_type: 'password',
      scope: '*',
      username,
      password,
    });
  });

  it('throws error on failure', async () => {
    postSpy.mockRejectedValueOnce(new Error('some network error'));

    await expect(getNodeRedToken(username, password))
      .rejects
      .toThrow('Failed to get Node-RED token');

    expect(postSpy).toHaveBeenCalledOnce();
  });
});
