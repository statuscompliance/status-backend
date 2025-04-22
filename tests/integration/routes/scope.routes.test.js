import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { request } from '../../setup/setup.js';
import * as db from '../../setup/database';
//import { v4 as uuidv4 } from 'uuid';
// import {sequelize} from '../../setup/setup';
import { models } from '../../../src/models/models.js';
//import Scope from '../../../src/models/scope.model.js';
import ScopeSet from '../../../src/models/scopeSet.model.js';

import {
  sampleScopes,
  newScopeData,
  invalidScopeData,
//  updatedScopeData,
} from '../../utils/sampleScopesData.js';
import {
  sampleScopeSets,
//  newScopeSetData,
//  updatedScopeSetData,
//  scopeSetForControlId101,
} from '../../utils/sampleScopeSetsData.js';

import * as endpointMiddleware from '../../../src/middleware/endpoint';

const API_PREFIX = process.env.API_PREFIX || '/api/v1';

describe('SCOPE ENDPOINTS TEST', () => {
  beforeAll(async () => {
    // await connect(); // Conecta a las bases de datos
    // await sequelize.sync({ force: true }); // Sincroniza los modelos Sequelize con la base de datos
    // await models.sequelize.sync({ force: true });
    
    await db.clearDatabase();
    
    vi.spyOn(endpointMiddleware, 'endpointAvailable').mockImplementation(
      (req, res, next) => {
        next();
      }
    );
    /*
    for (const sample of sampleScopes) {
        await models.Scope.bulkCreate(sample);
    }q
    */
    await models.Scope.bulkCreate(sampleScopes[0]);
    await models.Scope.bulkCreate(sampleScopes[1]);
    await models.Scope.bulkCreate(sampleScopes[2]);

    // Insertar ScopeSets de prueba (usando Mongoose)
    await ScopeSet.insertMany(
      sampleScopeSets.map((set) => ({
        ...set,
        scopes: Object.fromEntries(set.scopes),
      }))
    );
  });

  afterAll(async () => {
    // await models.Scope.destroy({ truncate: true, cascade: true });
    await ScopeSet.deleteMany({});
    await db.clearDatabase();
    await db.closeDatabase();
    vi.restoreAllMocks();
  });

  describe('GET /scopes', () => {
    it('should return 200 and an array of scopes', async () => {
      const response = await request.get(`${API_PREFIX}/scopes`);
      //  const response = await request.get('/scopes');
      expect(response.status).toBe(200);
      expect(response.body.length).toBe(sampleScopes.length);
    });
  });

  describe('POST /scopes', () => {
    it('should return 201 and create a new scope', async () => {
      const response = await request
        .post(`${API_PREFIX}/scopes`)
        .send(newScopeData);
      expect(response.status).toBe(201);
      expect(response.body.name).toBe(newScopeData.name);
    });

    it('should return 400 for invalid scope data', async () => {
      const response = await request
        .post(`${API_PREFIX}/scopes`)
        .send(invalidScopeData);
      expect(response.status).toBe(400);
      expect(response.body.error).toBe(
        'Name must be in lowercase and spaces replaced with underscores'
      );
    });
  });
});

/*
  describe('test route scopes', () => {
    it('should return 200 and the correct scope', async () => {
      const response = await request.get(`${API_PREFIX}/scopes`);
      expect(response.status).toBe(200);
      expect(response.body.id).toBe(testScope.id);
      expect(response.body.name).toBe(testScope.name);
    });
   
    it('should return 201 and create a new scope', async () => {
      const newScopeData = { name: 'test_scope', description: 'A test scope', type: 'string', default: 'test' };
      const response = await request.post(`${API_PREFIX}/scopes`).send(newScopeData);
      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.name).toBe('test_scope');
    });

    it('should return 400 if name is missing or not a string', async () => {
      const invalidScopeData = { description: 'Invalid scope' };
      const response = await request.post(`${API_PREFIX}/scopes`).send(invalidScopeData);
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });

    it('should return 404 if scope id is not found', async () => {
      const invalidId = uuidv4();
      const response = await request.get(`${API_PREFIX}/scopes/${invalidId}`);
      expect(response.status).toBe(404);
    });

    it('should return 400 if scope id is not a valid UUID', async () => {
      const invalidId = 'not-a-uuid';
      const response = await request.get(`${API_PREFIX}/scopes/${invalidId}`);
      expect(response.status).toBe(400);
    });
  });

});
*/
