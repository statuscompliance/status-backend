import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
let _sequelize;
export const getSequelize = () => _sequelize;
import { initModels } from '../models/models.js';
import logger from '../config/logger.js';

const isTestEnvironment = !!import.meta.env?.VITEST;

const getPostgresConfig = async () => {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'statusdb',
    ssl: false,
    logging: (msg) => logger.database(msg),
  });
  logger.debug('Connecting to Postgres...', { 
    host: process.env.DB_HOST || 'localhost',
    database: process.env.DB_NAME || 'statusdb'
  });
  await sequelize.authenticate();
  logger.info('Postgres successfully connected');
  return sequelize;
}

const initMongoDB = async () => {
  try {
    logger.debug('Connecting to MongoDB...');
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://root:root@localhost:27017/statusdb?authSource=admin'
    );
    logger.info('MongoDB connected', {
      uri: process.env.MONGO_URI ? '[REDACTED]' : 'mongodb://root:root@localhost:27017/statusdb'
    });
  } catch (err) {
    logger.error('MongoDB connection error', { error: err.message, stack: err.stack });
  }
};

const initDB = async () => {
  logger.debug('Initializing database connections');
  await initMongoDB();
  return await getPostgresConfig();
};

export const registerDB = async (instance) => {
  if(!_sequelize) {
    _sequelize = instance;
    await initModels(_sequelize);
    logger.debug('Database models initialized');
  }
}

if (!isTestEnvironment) {
  await registerDB(await initDB());
}
