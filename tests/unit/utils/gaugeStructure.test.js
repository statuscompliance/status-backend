
import { describe, it, expect } from 'vitest';
import gaugeStructure from '../../../src/utils/gaugeStructure'; 

describe('gaugeStructure object', () => {
  it('should be defined', () => {
    expect(gaugeStructure).toBeDefined();
  });

  it('should have the correct datasource', () => {
    expect(gaugeStructure.datasource).toEqual({
      default: true,
      type: 'mysql',
      uid: 'P5E4ECD82955BB660',
    });
  });

  it('should have max and min values in fieldConfig.defaults', () => {
    expect(gaugeStructure.fieldConfig.defaults.max).toBe(100);
    expect(gaugeStructure.fieldConfig.defaults.min).toBe(0);
  });

  it('should contain the correct thresholds steps', () => {
    const steps = gaugeStructure.fieldConfig.defaults.thresholds.steps;
    expect(steps).toHaveLength(4);
    expect(steps[0]).toEqual({ color: 'red', value: null });
    expect(steps[1]).toEqual({ color: 'orange', value: 50 });
    expect(steps[2]).toEqual({ color: 'yellow', value: 70 });
    expect(steps[3]).toEqual({ color: 'green', value: 80 });
  });

  it('should contain SQL target query with expected structure', () => {
    const target = gaugeStructure.targets[0];
    expect(target.rawQuery).toBe(true);
    expect(target.rawSql).toContain('SELECT COUNT(`limit`)');
    expect(target.sql.columns[0].type).toBe('function');
  });

  it('should have correct panel type and title', () => {
    expect(gaugeStructure.type).toBe('gauge');
    expect(gaugeStructure.title).toBe('Panel Title');
  });
});
