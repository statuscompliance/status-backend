import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Sequelize } from 'sequelize';
import { newDb } from 'pg-mem';
import { registerDB } from '../../src/db/database';
import { models } from '../../src/models/models.js';

// moment is imported from pg-mem to avoid deprecation warnings
import moment from 'moment';
// Suppress deprecation warnings
moment.suppressDeprecationWarnings = true;

let mongoServer;
export let sequelize;

export const connect = async () => {
  await registerDB(await initPostgres());
  await sequelize.sync({ force: true });
  await initMongoDB();

  await setupEndpointConfigurations();
};


export const closeDatabase = async () => {
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer?.stop();
    console.log('[database] In-memory MongoDB closed');
  }

  if (sequelize) {
    await sequelize.close();
    console.log('[database] In-memory SQLite (PG mem) closed');
  }
};

export const clearDatabase = async () => {
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany();
    })
  );
  console.log('[database] In-memory MongoDB cleared');

  if (sequelize) {
    await sequelize.drop({ cascade: true });
    console.log('[database] In-memory SQLite (PG mem) cleared');
  }
};

async function initMongoDB() {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('[database] In-memory MongoDB connected');
}

async function initPostgres() {
  const pgMem = newDb();
  pgMem.public.registerFunction({
    name: 'current_database',
    returns: 'text',
    implementation: () => 'pg-mem',
  });
  const adapter = pgMem.adapters.createPg();

  sequelize = new Sequelize('postgres://user:pass@localhost:5432/dbname', {
    dialect: 'postgres',
    logging: false,
    dialectModule: adapter,
  });

  await sequelize.authenticate();
  console.log('[database] In-memory SQLite (PG mem) connected');
  return sequelize;
}

async function setupEndpointConfigurations() {
  const endpoints = [
    '/config', '/users', '/scripts', '/controls', '/grafana',
    '/thread', '/catalogs', '/assistant', '/ghAccessToken', '/getAuth',
    '/computations', '/points', '/scopes', 'docs', 'api-docs',
  ];

  for (const endpoint of endpoints) {
    await models.Configuration.create({
      endpoint,
      available: true,
      limit: 100
    });
  }
  
  console.log('[database] Endpoint configurations created');
}
