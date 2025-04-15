import { describe, it, expect } from 'vitest';
import createPanelTemplate from '../../../src/utils/panelStructures';
import gaugeStructure from '../../../src/utils/gaugeStructure'; 

describe('createPanelTemplate', () => {
  it('should return the correct template for a supported type', () => {
    const template = createPanelTemplate('gauge');
    expect(template).toEqual(gaugeStructure);
    // You might want to add more specific assertions based on the expected content of gaugeStructure
    expect(template).toHaveProperty('type', 'gauge');
    expect(template).toHaveProperty('options');
  });

  it('should throw an error when type is unsupported', () => {
    const unsupportedType = 'unknown';
    expect(() => createPanelTemplate(unsupportedType)).toThrowError(
      `Panel type not supported: ${unsupportedType}`
    );
  });

  it('should return a new object instance, not a reference to the original structure', () => {
    const template1 = createPanelTemplate('gauge');
    const template2 = createPanelTemplate('gauge');
    expect(template1).not.toBe(gaugeStructure);
    expect(template2).not.toBe(gaugeStructure);
    expect(template1).not.toBe(template2);

    // Verify that modifying the returned template doesn't affect the original structure
    template1.newProperty = 'test';
    expect(gaugeStructure).not.toHaveProperty('newProperty');
  });

  it('should deeply clone the structure, preventing shared nested references', () => {
    const template = createPanelTemplate('gauge');
    template.options.minVizWidth = 999;
    expect(gaugeStructure.options.minVizWidth).not.toBe(999);
  });
});
