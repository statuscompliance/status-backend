import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as grafanaService from '../../../src/config/grafana.js';
import redis from '../../../src/config/redis.js';
import * as panelUtils from '../../../src/utils/panelUtils.js';


describe('mapPanelsToDTO', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    vi.spyOn(redis, 'get');
    vi.spyOn(redis, 'set');
    vi.spyOn(grafanaService.methods.dashboard, 'getDashboardByUID');
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should skip panels without dashboardUid', async () => {
    const panels = [{ id: 1 }, { id: 2, dashboardUid: null }, { id: 3, dashboardUid: '' }];
    const result = await panelUtils.mapPanelsToDTO(panels);
    expect(result).toEqual([]);
  });

  it('should return cached panel data if present in Redis', async () => {
    const panels = [{ id: 1, dashboardUid: 'uid1', name: 'panel1' }];

    redis.get.mockResolvedValueOnce(JSON.stringify({ title: 'Cached Title', type: 'graph' }));

    const result = await panelUtils.mapPanelsToDTO(panels);

    expect(redis.get).toHaveBeenCalledWith('grafana:panel:1');
    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 1,
      dashboardUid: 'uid1',
      title: 'Cached Title',
      type: 'graph',
      name: 'panel1',
    });
    expect(redis.set).not.toHaveBeenCalled();
  });

  it('should fetch from Grafana and cache when Redis cache misses', async () => {
    const panels = [{ id: 42, dashboardUid: 'dash123', foo: 'bar' }];

    redis.get.mockResolvedValueOnce(null);

    const dashboardResponse = {
      data: {
        dashboard: {
          panels: [
            {
              id: 42,
              title: 'Panel Title',
              type: 'table',
              gridPos: { h: 5, w: 10, x: 0, y: 0 },
              targets: [
                { rawSql: 'SELECT * FROM table', table: 'table', alias: 'Display Name' }
              ],
            },
          ],
        },
      },
    };

    grafanaService.methods.dashboard.getDashboardByUID.mockResolvedValue(dashboardResponse);
    redis.set.mockResolvedValue('OK');

    const result = await panelUtils.mapPanelsToDTO(panels);

    expect(redis.get).toHaveBeenCalledWith('grafana:panel:42');
    expect(grafanaService.methods.dashboard.getDashboardByUID).toHaveBeenCalledWith('dash123');

    expect(result).toHaveLength(1);
    expect(result[0]).toMatchObject({
      id: 42,
      dashboardUid: 'dash123',
      title: 'Panel Title',
      type: 'table',
      sqlQuery: 'SELECT * FROM table',
      table: 'table',
      displayName: 'Display Name',
      gridPos: { h: 5, w: 10, x: 0, y: 0 },
      foo: 'bar',
    });

    expect(redis.set).toHaveBeenCalledWith(
      'grafana:panel:42',
      JSON.stringify({
        title: 'Panel Title',
        type: 'table',
        sqlQuery: 'SELECT * FROM table',
        table: 'table',
        displayName: 'Display Name',
        gridPos: { h: 5, w: 10, x: 0, y: 0 },
      }),
      'EX',
      7 * 24 * 60 * 60
    );
  });

  it('should skip panel if not found in fetched dashboard panels', async () => {
    const panels = [{ id: 100, dashboardUid: 'dashX' }];

    redis.get.mockResolvedValueOnce(null);

    const dashboardResponse = {
      data: {
        dashboard: {
          panels: [
            { id: 101, title: 'Other Panel', type: 'graph' }
          ],
        },
      },
    };

    grafanaService.methods.dashboard.getDashboardByUID.mockResolvedValue(dashboardResponse);

    const result = await panelUtils.mapPanelsToDTO(panels);

    expect(result).toEqual([]);
  });

  it('should catch errors and skip panel on Grafana API failure', async () => {
    const panels = [{ id: 5, dashboardUid: 'badUID' }];

    redis.get.mockResolvedValueOnce(null);
    grafanaService.methods.dashboard.getDashboardByUID.mockRejectedValue(new Error('API error'));

    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const result = await panelUtils.mapPanelsToDTO(panels);

    expect(result).toEqual([]);
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      'Error mapping panel 5 for dashboard badUID:',
      expect.any(Error)
    );

    consoleErrorSpy.mockRestore();
  });
});
