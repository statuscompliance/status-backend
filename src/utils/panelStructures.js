import gaugeStructure from './gaugeStructure';

const panelStructures = {
  gauge: gaugeStructure,
};

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

  return structuredClone(structure)
}

export default createPanelTemplate;
