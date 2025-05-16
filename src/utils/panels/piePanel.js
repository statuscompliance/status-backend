import { createBasePanelConfig } from './basePanelConfig.js';

const piePanel = {
  ...createBasePanelConfig({
    title: 'Pie Chart Panel',
    type: 'piechart'
  }),
  fieldConfig: {
    defaults: {
      color: {
        mode: 'palette-classic'
      },
      custom: {
        hideFrom: {
          legend: false,
          tooltip: false,
          viz: false
        }
      },
      mappings: [],
      displayName: 'Value'
    },
    overrides: []
  },
  options: {
    legend: {
      displayMode: 'list',
      placement: 'right',
      showLegend: true,
      values: ['percent']
    },
    pieType: 'pie',
    reduceOptions: {
      calcs: ['lastNotNull'],
      fields: '',
      values: false
    },
    tooltip: {
      mode: 'single',
      sort: 'none'
    }
  }
};

export default piePanel;
