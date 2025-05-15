import gaugeStructure from './panels/gaugeStructure';
import graphPanel from './panels/graphPanel';
import tablePanel from './panels/tablePanel';
import statPanel from './panels/statPanel';
import timeseriesPanel from './panels/timeseriesPanel';
import barPanel from './panels/barPanel';
import piePanel from './panels/piePanel';
import geoMapPanel from './panels/geoMapPanel';

/** 
 * Object containing the structure of different panel types
 */
const panelStructures = {
  gauge: gaugeStructure,
  graph: graphPanel,
  table: tablePanel,
  stat: statPanel,
  timeseries: timeseriesPanel,
  bar: barPanel,
  pie: piePanel,
  geomap: geoMapPanel
};

/**
 * Creates a panel template based on the provided type.
 * @param {string} type - The type of the panel to create.
 * @returns {object} - A structured clone of the panel template.
 * @throws {Error} - If the panel type is not supported.
 */
function createPanelTemplate(type) {
  const structure = Object.prototype.hasOwnProperty.call(
    panelStructures,
    type
  )
    ? panelStructures[type]
    : undefined;

  if (!structure) {
    throw new Error(`Panel type not supported: ${type}`);
  }

  return structuredClone(structure);
}

export default createPanelTemplate;
