import { describe, it, expect } from 'vitest';
import geoMapPanel from '../../../../src/utils/panels/geoMapPanel.js';

describe('geoMapPanel', () => {
  it('should have the correct structure', () => {
    expect(geoMapPanel).toBeDefined();
    expect(typeof geoMapPanel).toBe('object');
  });

  it('should have datasource configuration', () => {
    expect(geoMapPanel.datasource).toBeDefined();
    expect(geoMapPanel.datasource.type).toBe('grafana-postgresql-datasource');
    expect(geoMapPanel.datasource.uid).toBeDefined();
  });

  it('should have fieldConfig with defaults', () => {
    expect(geoMapPanel.fieldConfig).toBeDefined();
    expect(geoMapPanel.fieldConfig.defaults).toBeDefined();
    expect(geoMapPanel.fieldConfig.defaults.color).toEqual({ mode: 'thresholds' });
  });

  it('should have proper threshold configuration', () => {
    expect(geoMapPanel.fieldConfig.defaults.thresholds).toBeDefined();
    expect(geoMapPanel.fieldConfig.defaults.thresholds.mode).toBe('absolute');
    expect(geoMapPanel.fieldConfig.defaults.thresholds.steps).toBeInstanceOf(Array);
    expect(geoMapPanel.fieldConfig.defaults.thresholds.steps.length).toBeGreaterThan(0);
  });

  it('should have gridPos configuration', () => {
    expect(geoMapPanel.gridPos).toBeDefined();
    expect(geoMapPanel.gridPos.h).toBe(8);
    expect(geoMapPanel.gridPos.w).toBe(12);
    expect(geoMapPanel.gridPos.x).toBe(0);
    expect(geoMapPanel.gridPos.y).toBe(0);
  });

  it('should have options with basemap configuration', () => {
    expect(geoMapPanel.options).toBeDefined();
    expect(geoMapPanel.options.basemap).toBeDefined();
    expect(geoMapPanel.options.basemap.config).toBeDefined();
    expect(geoMapPanel.options.basemap.type).toBe('default');
  });

  it('should have correct type and title', () => {
    expect(geoMapPanel.type).toBe('geomap');
    expect(geoMapPanel.title).toBe('GeoMap Panel');
  });

  it('should have targets array with proper structure', () => {
    expect(geoMapPanel.targets).toBeInstanceOf(Array);
    expect(geoMapPanel.targets.length).toBeGreaterThan(0);
    expect(geoMapPanel.targets[0]).toHaveProperty('datasource');
    expect(geoMapPanel.targets[0]).toHaveProperty('rawSql');
  });

  it('should have layers configuration in options', () => {
    expect(geoMapPanel.options.layers).toBeInstanceOf(Array);
    expect(geoMapPanel.options.layers.length).toBeGreaterThan(0);
    expect(geoMapPanel.options.layers[0].type).toBe('markers');
  });

  it('should have view configuration with coordinates', () => {
    expect(geoMapPanel.options.view).toBeDefined();
    expect(geoMapPanel.options.view).toHaveProperty('lat');
    expect(geoMapPanel.options.view).toHaveProperty('lon');
    expect(geoMapPanel.options.view).toHaveProperty('zoom');
  });
});
