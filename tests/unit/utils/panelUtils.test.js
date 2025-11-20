import { describe, it, expect } from 'vitest';
import { mapPanelsToDTO } from '../../../src/utils/panelUtils.js';

describe('panelUtils - mapPanelsToDTO', () => {
  it('should return an empty array when no panels are provided', async () => {
    const result = await mapPanelsToDTO([]);
    expect(result).toEqual([]);
  });

  it('should skip panels without dashboardUid', async () => {
    const panels = [
      { id: 1, title: 'Panel 1' },
      { id: 2, title: 'Panel 2' }
    ];

    const result = await mapPanelsToDTO(panels);
    expect(result).toEqual([]);
  });

  it('should handle errors when fetching from Grafana API gracefully', async () => {
    const panels = [
      { id: 1, dashboardUid: 'invalid-uid-that-does-not-exist' }
    ];

    // This should not throw an error, but return empty array
    const result = await mapPanelsToDTO(panels);
    expect(Array.isArray(result)).toBe(true);
  });

  it('should handle panels with dataValues property', async () => {
    const panels = [
      {
        dataValues: { id: 2, title: 'Test' }
      }
    ];

    // Should skip panels without dashboardUid even with dataValues
    const result = await mapPanelsToDTO(panels);
    expect(result).toEqual([]);
  });
});
