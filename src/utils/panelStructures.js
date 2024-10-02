import gaugeStructure from "./gaugeStructure";

const panelStructures = {
    gauge: gaugeStructure,
};

function createPanelTemplate(type) {
    const structure = panelStructures[type];

    if (!structure) {
        throw new Error(`Tipo de panel no soportado: ${type}`);
    }

    return {
        ...structure,
    };
}

export default createPanelTemplate;
