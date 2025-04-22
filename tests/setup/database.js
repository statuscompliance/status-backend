import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Sequelize } from 'sequelize';
import { newDb } from 'pg-mem';
import { registerDB } from '../../src/db/database';
import { models } from '../../src/models/models.js';
import { vi } from 'vitest';

import moment from 'moment';
moment.suppressDeprecationWarnings = true;

let mongoServer;
export let sequelize;

export const isIntegrationTest = process.env.VITE_TEST_TYPE !== 'unit';

export const connect = async () => {
  if (isIntegrationTest) {
    await registerDB(await initPostgres());
    await sequelize.sync({ force: true });
    await initMongoDB();
    await setupEndpointConfigurations();
  } else {
    console.log('[database] Using mocks for unit tests');
    mockModelsForUnitTests();
  }
};

export function mockModelsForUnitTests() {
  const requiredModels = [
    'Configuration', 
    'Scope',
    'User',
    'Script',
    'Control',
    'Point',
    'Computation',
    'Assistant',
    'Thread',
    'Catalog'
  ];
  
  requiredModels.forEach(modelName => {
    models[modelName] = createMockModel(modelName);
  });
  
  console.log('[database] Models mocked for unit tests');
}

function createMockModel(modelName) {
  const mockInstance = { 
    id: 'mock-id', 
    ...mockData(modelName),
    dataValues: { id: 'mock-id', ...mockData(modelName) }
  };

  return {
    findAll: vi.fn().mockResolvedValue([mockInstance]),
    findOne: vi.fn().mockResolvedValue(mockInstance),
    findByPk: vi.fn().mockResolvedValue(mockInstance),
    create: vi.fn().mockResolvedValue(mockInstance),
    update: vi.fn().mockResolvedValue([1]),
    destroy: vi.fn().mockResolvedValue(1),
    bulkCreate: vi.fn().mockResolvedValue([mockInstance]),
    count: vi.fn().mockResolvedValue(1),
    findAndCountAll: vi.fn().mockResolvedValue({ 
      count: 1, 
      rows: [mockInstance] 
    }),
  };
}

function mockData(modelName) {
  const defaultData = { name: 'Mock Name', createdAt: new Date(), updatedAt: new Date() };
  
  const modelSpecificData = {
    Configuration: { endpoint: '/mock', available: true, limit: 100 },
    Scope: { name: 'mock_scope', description: 'Mock scope', type: 'mock', default: false },
    User: { username: 'mockuser', email: 'mock@example.com', passwordHash: 'hash' },
    Script: { name: 'Mock Script', content: 'console.log("hello")' },
    Control: { name: 'Mock Control', status: 'active' },
    Point: { name: 'Mock Point', value: 42 },
    Computation: { name: 'Mock Computation', formula: 'x + y' }
  };
  
  return modelSpecificData[modelName] || defaultData;
}

export const closeDatabase = async () => {
  if (!isIntegrationTest) return;

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
  if (!isIntegrationTest) return;

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
