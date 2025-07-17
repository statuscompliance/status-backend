import { beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import supertest from 'supertest';
import axios from 'axios';
import configureApp from '../../src/index.js';
import logger from '../../src/config/logger.js';

const app = configureApp();
let server;
let request;

const externalServices = [
  {
    name: 'Grafana',
    url: 'http://localhost:3100',
    healthEndpoint: '/api/health'
  },
  // Add other external services that need to be verified here
];

async function checkServiceHealth(service) {
  try {
    const response = await axios.get(`${service.url}${service.healthEndpoint}`);
    return response.status === 200;
  } catch (error) {
    logger.error(`Error checking ${service.name} health: ${error.message}`);
    return false;
  }
}

async function checkExternalServices() {
  const results = await Promise.all(
    externalServices.map(async (service) => {
      const isHealthy = await checkServiceHealth(service);
      return {
        service: service.name,
        healthy: isHealthy
      };
    })
  );

  const unhealthyServices = results.filter(result => !result.healthy);
  if (unhealthyServices.length > 0) {
    const services = unhealthyServices.map(s => s.service).join(', ');
    throw new Error(`External services not available: ${services}`);
  }
}

beforeAll(async () => {
  // Check external services before starting tests
  await checkExternalServices();
  
  server = app.listen(0);
  request = supertest.agent(server);
  logger.info('E2E test server started');
});

beforeEach(async () => {
  // Add test data initialization here if needed
});

afterEach(async () => {
  // Clean up after each test if needed
});

afterAll(async () => {
  if (server) {
    server.close();
    logger.info('E2E test server closed');
  }
});

export { request };
