import { createBasePanelConfig } from './basePanelConfig.js';

const statPanel = {
  ...createBasePanelConfig({
    title: 'Stat Panel',
    type: 'stat',
    colorMode: 'thresholds'
  }),
  options: {
    colorMode: 'value',
    graphMode: 'area',
    justifyMode: 'auto',
    orientation: 'auto',
    reduceOptions: {
      calcs: ['lastNotNull'],
      fields: '',
      values: false
    },
    textMode: 'auto'
  },
  pluginVersion: '10.0.3'
};

export default statPanel;
