import { beforeAll, afterAll, beforeEach, vi } from 'vitest';
import supertest from 'supertest';
import { connect, clearDatabase, closeDatabase, mockModelsForUnitTests, isIntegrationTest } from './database';
import configureApp from '../../src/index.js';

const app = configureApp();

let server;
let request;

beforeAll(async () => {
  await connect();
  await mockRedis();
  server = app.listen(0);
  request = supertest.agent(server);
});

beforeEach(() => {
  if (!isIntegrationTest) {
    mockModelsForUnitTests();
  }
});

afterAll(async () => {
  if (isIntegrationTest) {
    await clearDatabase();
  }
  if (server) {
    server.close();
  }
  if (isIntegrationTest) {
    await closeDatabase();
  }
});

async function mockRedis() {
  vi.mock('ioredis', () => {
    return import('ioredis-mock');
  });
  console.log('[redis] Redis mocked');
}

export { request };
