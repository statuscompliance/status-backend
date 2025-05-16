import { createBasePanelConfig } from './basePanelConfig.js';
import { defaultFieldConfig, defaultOptions } from './panelConfigDefaults.js';
import { cloneDeep } from 'lodash';

const graphPanel = {
  ...createBasePanelConfig({
    title: 'Graph Panel',
    type: 'graph'
  }),
  fieldConfig: (() => {
    const config = cloneDeep(defaultFieldConfig);
    config.defaults.custom.fillOpacity = 10;
    return config;
  })(),
  options: defaultOptions
};

export default graphPanel;
