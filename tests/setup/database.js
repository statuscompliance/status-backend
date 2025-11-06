import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Sequelize } from 'sequelize';
import { newDb } from 'pg-mem';
import { registerDB } from '../../src/db/database';
import { models } from '../../src/models/models.js';
import logger from '../../src/config/logger.js';

// moment is imported from pg-mem to avoid deprecation warnings
import moment from 'moment';
// Suppress deprecation warnings
moment.suppressDeprecationWarnings = true;

let mongoServer;
let _sequelize;

export const getSequelize = () => _sequelize;

export const connect = async () => {
  await registerDB(await initPostgres());
  await _sequelize.sync({ force: true });
  await initMongoDB();

  await setupEndpointConfigurations();
};


export const closeDatabase = async () => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer?.stop();
    logger.debug('In-memory MongoDB closed');
  }

  if (_sequelize) {
    await _sequelize.close();
    logger.debug('In-memory SQLite (PG mem) closed');
  }
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany();
    })
  );
  logger.debug('In-memory MongoDB cleared');

  if (_sequelize) {
    await _sequelize.drop({ cascade: true });
    logger.debug('In-memory SQLite (PG mem) cleared');
  }
};

async function initMongoDB() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  logger.debug('In-memory MongoDB connected');
}

async function initPostgres() {
  const pgMem = newDb();
  pgMem.public.registerFunction({
    name: 'current_database',
    returns: 'text',
    implementation: () => 'pg-mem',
  });
  const adapter = pgMem.adapters.createPg();

  _sequelize = new Sequelize('postgres://user:pass@localhost:5432/dbname', {
    dialect: 'postgres',
    logging: false,
    dialectModule: adapter,
  });

  await _sequelize.authenticate();
  logger.debug('In-memory SQLite (PG mem) connected');
  return _sequelize;
}

async function setupEndpointConfigurations() {
  const endpoints = [
    '/config', '/users', '/scripts', '/controls', '/grafana',
    '/thread', '/catalogs', '/assistant', '/github/auth', '/header',
    '/computations', '/points', '/scopes', '/secrets', '/databinder',
    'docs', 'api-docs'
  ];

  for (const endpoint of endpoints) {
    await models.Configuration.create({
      endpoint,
      available: true,
      limit: 100
    });
  }
  
  logger.debug('Endpoint configurations created');
}
