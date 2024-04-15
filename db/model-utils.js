export async function associateModels(models) {
    try {
        if (typeof models !== 'object' || models === null) {
            throw new Error('Invalid models object');
        }

        for (const [modelName, model] of Object.entries(models)) {
            if (typeof modelName !== 'string' || modelName.trim() === '') {
                throw new Error('Invalid modelName detected');
            }

            if (typeof model !== 'function') {
                throw new Error(`Invalid model type for '${modelName}'`);
            }

            if (typeof model.associate === 'function') {
                await model.associate(models);
            }
        }
    } catch (error) {
        console.error('Error processing model associations:', error);
        throw error;
    }
}
