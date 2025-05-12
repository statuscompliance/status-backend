import { describe, it, expect } from 'vitest';
import createPanelTemplate from '../../../src/utils/panelStructures';
import gaugeStructure from '../../../src/utils/gaugeStructure';

describe('panelStructures Integration Tests', () => {

  it('should create a gauge panel template with correct structure', () => {
    const gaugePanel = createPanelTemplate('gauge');
    expect(gaugePanel).toEqual(gaugeStructure);
  });

  it('should return a new object instance each time', () => {
    const gaugePanel1 = createPanelTemplate('gauge');
    const gaugePanel2 = createPanelTemplate('gauge');
    expect(gaugePanel1).not.toBe(gaugePanel2);
  });

  it('should not modify the original gaugeStructure when modifying the created panel', () => {
    const gaugePanel = createPanelTemplate('gauge');
    gaugePanel.title = 'Modified Title';
    expect(gaugePanel.title).toBe('Modified Title');
    expect(gaugeStructure.title).toBe('Panel Title');
  });

  it.each([
    ['', 'Panel type not supported: '],
    [null, 'Panel type not supported: null'],
    [undefined, 'Panel type not supported: undefined'],
    ['unsupported', 'Panel type not supported: unsupported'],
  ])('should handle %s as panel type and throw an error', (panelType, expectedError) => {
    expect(() => createPanelTemplate(panelType)).toThrowError(expectedError);
  });

});
