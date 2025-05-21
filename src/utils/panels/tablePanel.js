import { createBasePanelConfig } from './basePanelConfig.js';

const tablePanel = {
  ...createBasePanelConfig({
    title: 'Table Panel',
    type: 'table'
  }),
  fieldConfig: {
    defaults: {
      color: {
        mode: 'thresholds'
      },
      custom: {
        align: 'auto',
        cellOptions: {
          type: 'auto'
        },
        filterable: true,
        inspect: false
      },
      mappings: [],
      thresholds: {
        mode: 'absolute',
        steps: [
          {
            color: 'green',
            value: null
          },
          {
            color: 'red',
            value: 80
          }
        ]
      },
      displayName: 'Value'
    },
    overrides: []
  },
  options: {
    cellHeight: 'sm',
    footer: {
      countRows: false,
      fields: '',
      reducer: ['sum'],
      show: false
    },
    showHeader: true
  }
};

export default tablePanel;
