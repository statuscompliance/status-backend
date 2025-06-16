import { describe, it, expect, vi, beforeEach } from 'vitest';
import { searchItems } from '../../../../src/controllers/search.controller.js';
import { mockController } from '../../../utils/mockController.js';
import { methods } from '../../../../src/config/grafana.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';

describe('Grafana: Search Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      query: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  it('should return search results correctly', async () => {
    const mockData = [{ id: 1, title: 'Dashboard A' }];
    mockController(methods.search, 'search', { data: mockData });

    req.query = {
      query: 'dashboard',
      tag: 'dev',
      type: 'dash-db',
      dashboardUIDs: 'uid-1,uid-2',
      folderUIDs: 'folder-1,folder-2',
      starred: 'true',
      limit: '500',
      page: '2'
    };

    await searchItems(req, res);

    expect(methods.search.search).toHaveBeenCalledWith(
      'dashboard',
      ['dev'],
      'dash-db',
      undefined,
      ['uid-1', 'uid-2'],
      undefined,
      ['folder-1', 'folder-2'],
      true,
      500,
      2
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should use default values when optional query params are missing', async () => {
    const mockData = [{ id: 2, title: 'Dashboard B' }];
    mockController(methods.search, 'search', { data: mockData });

    await searchItems(req, res);

    expect(methods.search.search).toHaveBeenCalledWith(
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      undefined,
      1000,
      1
    );

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(mockData);
  });

  it('should handle errors properly', async () => {
    const error = new Error('Search failed');
    const spy = vi.spyOn(errorHandler, 'handleControllerError');
    mockController(methods.search, 'search', null, error);

    await searchItems(req, res);

    expect(spy).toHaveBeenCalledWith(res, error, 'Failed to search in Grafana');
  });
  it('should correctly parse single and multiple values for tag, dashboardUIDs and folderUIDs', async () => {
    const mockData = [{ id: 3 }];
    mockController(methods.search, 'search', { data: mockData });

    req.query = {
      tag: ['tag1', 'tag2'],
      dashboardUIDs: 'uid1',
      folderUIDs: ''
    };

    await searchItems(req, res);

    expect(methods.search.search).toHaveBeenCalledWith(
      undefined,         // query
      ['tag1', 'tag2'],  // tags
      undefined,         // type
      undefined,
      ['uid1'],          // dashUIDs
      undefined,
      undefined,         // folderUIDsParsed from ''
      undefined,         // starredFlag
      1000,
      1
    );
  });

  it('should correctly parse starredFlag when starred is true, false or invalid', async () => {
    const mockData = [{ id: 4 }];
    mockController(methods.search, 'search', { data: mockData });

    req.query = { starred: 'true' };
    await searchItems(req, res);
    expect(methods.search.search).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, true, 1000, 1
    );

    req.query = { starred: 'false' };
    await searchItems(req, res);
    expect(methods.search.search).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, false, 1000, 1
    );

    req.query = { starred: 'maybe' };
    await searchItems(req, res);
    expect(methods.search.search).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1000, 1
    );
  });
  it('should cap limit to 5000 when a higher value is provided', async () => {
    const mockData = [{ id: 5 }];
    mockController(methods.search, 'search', { data: mockData });

    req.query = { limit: '9999', page: '2' };

    await searchItems(req, res);

    expect(methods.search.search).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 5000, 2
    );
  });

  it('should fallback to default values when limit and page are invalid', async () => {
    const mockData = [{ id: 6 }];
    mockController(methods.search, 'search', { data: mockData });

    req.query = { limit: 'invalid', page: 'NaN' };

    await searchItems(req, res);

    expect(methods.search.search).toHaveBeenCalledWith(
      undefined, undefined, undefined, undefined, undefined, undefined, undefined, undefined, 1000, 1
    );
  });
});
