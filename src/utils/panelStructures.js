import timeseriesPanel from './panels/timeseriesPanel.js';
import tablePanel from './panels/tablePanel.js';
import statPanel from './panels/statPanel.js';
import piePanel from './panels/piePanel.js';
import barPanel from './panels/barPanel.js';
import gaugeStructure from './panels/gaugeStructure.js';
import graphPanel from './panels/graphPanel.js';

/**
 * Creates a panel structure based on the requested type
 * @param {string} type - The type of panel to create
 * @returns {Object} The panel structure
 * @throws {Error} If the panel type is not supported
 */
export default function createPanelTemplate(type) {
  const templates = {
    'timeseries': timeseriesPanel,
    'table': tablePanel,
    'stat': statPanel,
    'piechart': piePanel,
    'gauge': gaugeStructure,
    'bar': barPanel,
    'graph': graphPanel
  };

  if (!templates[type]) {
    throw new Error(`Unsupported panel type: ${type}`);
  }

  // Create a deep copy to avoid modifying the original template
  return JSON.parse(JSON.stringify(templates[type]));
}
