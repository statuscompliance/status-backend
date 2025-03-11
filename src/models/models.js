import { Sequelize } from 'sequelize';
import sequelize from '../db/database.js';
import applyExtraSetup from '../db/extra-setup.js';
import { associateModels } from '../db/model-utils.js';
import User from './user.model.js';
import Assistant from './assistant.model.js';
import Thread from './thread.model.js';
import Message from './message.model.js';
import Catalog from './catalog.model.js';
import Control from './control.model.js';
import Configuration from './configuration.model.js';
import Computation from './computation.model.js';
import Panel from './panel.model.js';
import Point from './point.model.js';
import Scope from './scope.model.js';

const models = {
  User,
  Assistant,
  Thread,
  Message,
  Catalog,
  Control,
  Configuration,
  Computation,
  Panel,
  Point,
  Scope,
};

try {
  associateModels(models);
} catch (error) {
  console.error('Error associating models:', error);
}

applyExtraSetup(sequelize);

export { sequelize, Sequelize, models };
export default models;
