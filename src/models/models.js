
import applyExtraSetup from '../db/extra-setup.js';
import { associateModels } from '../db/model-utils.js';
import { readdir } from 'node:fs/promises';

function filterModules(module){
  return ['scopeSet.model.js', 'models.js'].some(f => module.includes(f));
}
const VITEST_ENV = import.meta.env?.VITEST;

export const models = {};
export async function initModels(sequelize){
  const modules = VITEST_ENV ? 
    import.meta.glob('./*.js') : await readdir(import.meta.dirname);
  for (const model in modules) {
    const modelName = VITEST_ENV ? model : modules[model];
    if(!filterModules(modelName)) {
      const { default: newModel } = await (VITEST_ENV ? modules[modelName]() : import(`./${modelName}`));
      const instance = await newModel(sequelize);
      models[instance.name] = instance;
    }
  }
  try {
    associateModels(models);
  } catch (error) {
    console.error('Error associating models:', error);
  }
  applyExtraSetup(sequelize);
}