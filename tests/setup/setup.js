import { beforeAll, afterAll, vi } from 'vitest';
import supertest from 'supertest';
import { connect } from './database';

import * as db from './database';
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

afterAll(async () => {
  await db.clearDatabase();
  if (server) {
    server.close();
  }
});

async function mockRedis() {
  // Mock Redis
  vi.mock('ioredis', () => {
    return import('ioredis-mock'); // Dynamically import 'redis-mock' for mocking
  });
  console.log('[redis] Redis mocked');
}

export { request };
