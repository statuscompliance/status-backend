import { Sequelize } from 'sequelize';
import sequelize from './database.js';
import applyExtraSetup from './extra-setup.js';
import User from '../src/models/user.model.js';
import Assistant from '../src/models/assistant.model.js';
import Thread from '../src/models/thread.model.js';
import Message from '../src/models/message.model.js';
import Catalog from '../src/models/catalog.model.js';
import Control from '../src/models/control.model.js';
import Input from '../src/models/input.model.js';
import InputControl from '../src/models/input_control.model.js';
import { associateModels } from './model-utils.js';

const models = {
    User,
    Assistant,
    Thread,
    Message,
    Catalog,
    Control,
    Input,
    InputControl
};

try {
  associateModels(models);
} catch (error) {
  console.error('Error associating models:', error);
}

applyExtraSetup(sequelize);

export { sequelize, Sequelize, models };
export default models;