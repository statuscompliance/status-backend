import { createBaseTarget } from './baseTargets.js';

/**
 * Base configuration for all panels
 * @param {Object} options - Configuration options
 * @returns {Object} - Base panel configuration
 */
export function createBasePanelConfig({
  title = 'Panel Title',
  type = 'timeseries',
  displayName = 'Value',
  gridPos = { h: 8, w: 12, x: 0, y: 0 },
  colorMode = 'palette-classic',
  rawSql,
  thresholds = {
    mode: 'absolute',
    steps: [
      { color: 'green', value: null },
      { color: 'red', value: 80 }
    ]
  }
} = {}) {
  return {
    datasource: {
      type: 'grafana-postgresql-datasource',
      uid: 'P5E4ECD82955BB660'
    },
    fieldConfig: {
      defaults: {
        color: {
          mode: colorMode
        },
        mappings: [],
        thresholds,
        displayName
      },
      overrides: []
    },
    gridPos,
    targets: [createBaseTarget(rawSql)],
    title,
    type
  };
}
