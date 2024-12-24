/**
 * Associates models by calling their 'associate' method.
 * 
 * @param {object} models - The models object containing the models to be associated.
 * @throws {Error} If the models object is not a valid object.
 * @throws {Error} If an invalid modelName is detected.
 * @throws {Error} If an invalid model type is detected.
 * @returns {Promise<void>} A promise that resolves when all models have been associated.
 */
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
