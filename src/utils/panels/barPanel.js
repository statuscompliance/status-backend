import { createBasePanelConfig } from './basePanelConfig.js';
import { defaultFieldConfig, defaultOptions } from './panelConfigDefaults.js';
import _ from 'lodash';

const barPanel = {
  ...createBasePanelConfig({
    title: 'Bar Panel',
    type: 'timeseries'
  }),
  fieldConfig: (() => {
    const config = _.cloneDeep(defaultFieldConfig);
    config.defaults.custom.drawStyle = 'bars';
    config.defaults.custom.fillOpacity = 70;
    config.defaults.custom.showPoints = 'never';
    return config;
  })(),
  options: defaultOptions
};

export default barPanel;
