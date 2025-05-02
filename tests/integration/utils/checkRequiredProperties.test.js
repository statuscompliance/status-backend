import { checkRequiredProperties } from '../../../src/utils/checkRequiredProperties.js';
import { describe, test, expect } from 'vitest';
import request from 'supertest';
import express from 'express';

const app = express();
app.use(express.json());

app.post('/test-endpoint', (req, res) => {
  const { body } = req;
  const requiredProps = ['name', 'value'];
  const result = checkRequiredProperties(body, requiredProps);

  if (result.validation) {
    return res.status(200).json({ message: 'Success' });
  } else {
    return res.status(400).json({ error: result.textError });
  }
});

describe('checkRequiredProperties API Integration Tests', () => {
  test('should return 200 when all required properties are present', async () => {
    const response = await request(app)
      .post('/test-endpoint')
      .send({ name: 'Test', value: 123 });

    expect(response.statusCode).toBe(200);
    expect(response.body).toEqual({ message: 'Success' });
  });

  test('should return 400 when some required properties are missing', async () => {
    const response = await request(app)
      .post('/test-endpoint')
      .send({ name: 'Test' });

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Missing required properties: value' });
  });

  test('should return 400 when all required properties are missing', async () => {
    const response = await request(app)
      .post('/test-endpoint')
      .send({});

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Missing required properties: name, value' });
  });

  test('should return 400 when the request body is null', async () => {
    const response = await request(app)
      .post('/test-endpoint')
      .send(null);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid object or missing required properties' });
  });

  test('should return 400 when the request body is undefined', async () => {
    const response = await request(app)
      .post('/test-endpoint')
      .send(undefined);

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid object or missing required properties' });
  });

  test('should return 400 when the request body is not an object', async () => {
    const response = await request(app)
      .post('/test-endpoint')
      .send('not an object');

    expect(response.statusCode).toBe(400);
    expect(response.body).toEqual({ error: 'Invalid object or missing required properties' });
  });
});
