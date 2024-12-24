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
    throw new Error(`Tipo de panel no soportado: ${type}`);
  }

  return {
    ...structure,
  };
}

export default createPanelTemplate;
