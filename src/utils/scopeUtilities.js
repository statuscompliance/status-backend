import ScopeSet from '../models/scopeSet.model.js';
import { models } from '../models/models.js';
import { Op } from 'sequelize';

export async function getScopeSpecs(scopeKeys){
  try {
    const scopeSpecsArray = await models.Scope.findAll({
      attributes: ['name', 'description', 'type', 'default'],
      where: {
        name: {
          [Op.in]: scopeKeys
        }
      }
    });

    const scopeSpecs = {};
    scopeSpecsArray.forEach(element => {
      scopeSpecs[element.name] = element;
    });
    return scopeSpecs;
  } catch (error) {
    throw new Error(error.message);
  }
}

export async function getScopeSetsByControlIds(controlIds){
  try {
    const scopeSets = await ScopeSet.find({
      controlId: { $in: controlIds },
    }).select({ _id:0 ,controlId: 1, scopes: 1 });    
    const scopesKeySet = getUniqueScopeKeys(scopeSets);
    return { scopesKeySet: scopesKeySet, scopeSets: scopeSets };
  } catch (error) {
    throw new Error(error.message);
  }
}

export function getUniqueScopeKeys(objects) {
  const keys = new Set();

  // Protection against null, undefined, etc.
  if (!objects) return [];

  // Ensures it is an array
  if (!Array.isArray(objects)) {
    objects = [objects];
  }

  objects.forEach(obj => {
    // Verify that obj.scopes is an iterable object (such as Map).
    if (obj.scopes && typeof obj.scopes?.keys === 'function') {
      for (const key of obj.scopes.keys()) {
        keys.add(key);
      }
    }
  });

  return Array.from(keys);
}
