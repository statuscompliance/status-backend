import { Sequelize } from 'sequelize';
import sequelize from './database.js';
import applyExtraSetup from './extra-setup.js';
import User from '../src/models/user.model.js';
import Assistant from '../src/models/assistant.model.js';
import Thread from '../src/models/thread.model.js';
import Message from '../src/models/message.model.js';
import Catalog from '../src/models/catalog.model.js';
import Control from '../src/models/control.model.js';
import Configuration from '../src/models/configuration.model.js';
import { associateModels } from './model-utils.js';
import Computation from '../src/models/computation.model.js';
import Panel from '../src/models/panel.model.js';
import Point from '../src/models/point.model.js';

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
  Point
};

try {
  associateModels(models);
} catch (error) {
  console.error('Error associating models:', error);
}

applyExtraSetup(sequelize);

export { sequelize, Sequelize, models };
export default models;
