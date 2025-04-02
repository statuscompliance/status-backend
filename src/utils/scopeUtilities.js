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


function getUniqueScopeKeys(objects) {
  const keys = new Set();

  if (!Array.isArray(objects)) {
    objects = [objects];
  }

  objects.forEach(obj => {
    if (obj.scopes && typeof obj.scopes === 'object') {
      obj.scopes.keys().forEach(key => {
        keys.add(key);
      });
    }
  });
  return Array.from(keys);
}