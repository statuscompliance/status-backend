import { createBasePanelConfig } from './basePanelConfig.js';
import { defaultFieldConfig, defaultOptions, defaultTimeseriesTarget } from './panelConfigDefaults.js';

const timeseriesPanel = {
  ...createBasePanelConfig({
    title: 'Timeseries Panel',
    type: 'timeseries'
  }),
  fieldConfig: defaultFieldConfig,
  options: defaultOptions,
  targets: [defaultTimeseriesTarget],
  gridPos: {
    h: 8,
    w: 12,
    x: 0,
    y: 0
  }
};

export default timeseriesPanel;
