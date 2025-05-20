import { expect, describe, it, beforeAll, beforeEach, afterEach } from 'vitest';
import { request } from '../../setup/setup.js';
import { models } from '../../../src/models/models.js';
import { sampleScopes } from '../../utils/sampleScopesData.js';
import { adminUser } from '../../utils/sampleUserData.js';
import { sampleScopeSets } from '../../utils/sampleScopesSetData.js';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import ScopeSet from '../../../src/models/scopeSet.model.js';

describe('Scope API Routes', () => {
  let token;
  
  beforeAll(async () => {
    token = jwt.sign(
      { userId: adminUser._id, username: adminUser.username, authority: adminUser.authority },
      'test-secret-key'
    );
    
    request.set('Cookie', `accessToken=${token}`);
  });

  describe('GET /scopes', () => {
    beforeEach(async () => {
      await models.Scope.destroy({ where: {}, truncate: true });
      await models.Scope.bulkCreate(sampleScopes);
    });

    it('should retrieve all scopes', async () => {
      const response = await request.get('/scopes');
      
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(sampleScopes.length);
      
      for (let i = 0; i < sampleScopes.length; i++) {
        expect(response.body[i].name).toBe(sampleScopes[i].name);
        expect(response.body[i].description).toBe(sampleScopes[i].description);
        expect(response.body[i].type).toBe(sampleScopes[i].type);
        expect(response.body[i].default).toBe(sampleScopes[i].default);
      }
    });
  });

  describe('GET /scopes/:id', () => {
    let scope;

    beforeEach(async () => {
      await models.Scope.destroy({ where: {}, truncate: true });
      scope = await models.Scope.create(sampleScopes[0]);
    });

    it('should retrieve a scope by id', async () => {
      const response = await request.get(`/scopes/${scope.id}`);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe(scope.name);
      expect(response.body.description).toBe(scope.description);
      expect(response.body.type).toBe(scope.type);
      expect(response.body.default).toBe(scope.default);
    });

    it('should return 404 if scope not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.get(`/scopes/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scope not found');
    });

    it('should return 400 if id is invalid', async () => {
      const response = await request.get('/scopes/invalid-id');
      
      expect(response.status).toBe(400);
    });
  });

  describe('POST /scopes', () => {
    beforeEach(async () => {
      await models.Scope.destroy({ where: {}, truncate: true });
    });

    it('should create a new scope', async () => {
      const newScope = {
        name: 'New Scope',
        description: 'New scope description',
        type: 'string',
        default: 'false'
      };

      const response = await request.post('/scopes').send(newScope);
      
      expect(response.status).toBe(201);
      expect(response.body.name).toBe('new_scope');
      expect(response.body.description).toBe(newScope.description);
      expect(response.body.type).toBe(newScope.type);
      expect(response.body.default).toBe(newScope.default);

      // Verify it was saved to the database
      const savedScope = await models.Scope.findByPk(response.body.id);
      expect(savedScope).not.toBeNull();
    });

    it('should return 400 if name is not a string', async () => {
      const invalidScope = {
        name: 123,
        description: 'Invalid scope',
        type: 'string',
        default: false
      };

      const response = await request.post('/scopes').send(invalidScope);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name must be a string');
    });
  });

  describe('PUT /scopes/:id', () => {
    let scope;

    beforeEach(async () => {
      await models.Scope.destroy({ where: {}, truncate: true });
      scope = await models.Scope.create(sampleScopes[0]);
    });

    it('should update a scope by id', async () => {
      const updatedData = {
        name: 'Updated Scope',
        description: 'Updated description',
        type: 'number',
        default: 'true'
      };

      const response = await request.put(`/scopes/${scope.id}`).send(updatedData);
      
      expect(response.status).toBe(200);
      expect(response.body.name).toBe('updated_scope');
      expect(response.body.description).toBe(updatedData.description);
      expect(response.body.type).toBe(updatedData.type);
      expect(response.body.default).toBe(updatedData.default);

      // Verify it was updated in the database
      const updatedScope = await models.Scope.findByPk(scope.id);
      expect(updatedScope.name).toBe('updated_scope');
    });

    it('should return 404 if scope not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const updatedData = {
        name: 'Updated Scope',
        description: 'Updated description',
        type: 'number',
        default: true
      };

      const response = await request.put(`/scopes/${fakeId}`).send(updatedData);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scope not found');
    });

    it('should return 400 if name is not provided', async () => {
      const invalidData = {
        description: 'Updated description',
        type: 'number',
        default: true
      };

      const response = await request.put(`/scopes/${scope.id}`).send(invalidData);
      
      expect(response.status).toBe(400);
      expect(response.body.error).toBe('Name must be a string');
    });

    it('should return 400 if id is invalid', async () => {
      const response = await request.put('/scopes/invalid-id').send({
        name: 'Valid Name'
      });
      
      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /scopes/:id', () => {
    let scope;

    beforeEach(async () => {
      await models.Scope.destroy({ where: {}, truncate: true });
      scope = await models.Scope.create(sampleScopes[0]);
    });

    it('should delete a scope by id', async () => {
      const response = await request.delete(`/scopes/${scope.id}`);
      
      expect(response.status).toBe(204);

      // Verify it was deleted from the database
      const deletedScope = await models.Scope.findByPk(scope.id);
      expect(deletedScope).toBeNull();
    });

    it('should return 404 if scope not found', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';
      const response = await request.delete(`/scopes/${fakeId}`);
      
      expect(response.status).toBe(404);
      expect(response.body.error).toBe('Scope not found');
    });

    it('should return 400 if id is invalid', async () => {
      const response = await request.delete('/scopes/invalid-id');
      
      expect(response.status).toBe(400);
    });
  });

  describe('ScopeSet API Routes', () => {
    let scopeMap;

    beforeEach(async () => {
      await ScopeSet.deleteMany({});
      
      scopeMap = {};
      sampleScopeSets[0].scopes.forEach((value, key) => {
        scopeMap[key] = value;
      });
    });

    afterEach(async () => {
      await ScopeSet.deleteMany({});
    });

    describe('POST /scopes/sets', () => {
      it('should create a new scope set', async () => {
        const scopeSetData = {
          controlId: sampleScopeSets[0].controlId,
          scopes: Object.fromEntries(sampleScopeSets[0].scopes)
        };
        
        const response = await request.post('/scopes/sets').send(scopeSetData);
        
        expect(response.status).toBe(201);
        expect(response.body.controlId).toBe(scopeSetData.controlId);
        
        Object.entries(scopeSetData.scopes).forEach(([key, value]) => {
          expect(response.body.scopes[key]).toBe(value);
        });
      });
    });

    describe('GET /scopes/sets', () => {
      it('should retrieve all scope sets', async () => {
        const scopeSet = new ScopeSet({
          controlId: sampleScopeSets[0].controlId,
          scopes: scopeMap
        });
        await scopeSet.save();

        const response = await request.get('/scopes/sets');
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].controlId).toBe(sampleScopeSets[0].controlId);
      });
    });

    describe('GET /scopes/sets/:id', () => {
      it('should retrieve a scope set by id', async () => {
        const scopeSet = new ScopeSet({
          controlId: sampleScopeSets[0].controlId,
          scopes: scopeMap
        });
        await scopeSet.save();

        const response = await request.get(`/scopes/sets/${scopeSet._id}`);
        
        expect(response.status).toBe(200);
        expect(response.body.controlId).toBe(sampleScopeSets[0].controlId);

        Object.entries(scopeMap).forEach(([key, value]) => {
          expect(response.body.scopes[key]).toBe(value);
        });
      });

      it('should return 404 if scope set not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request.get(`/scopes/sets/${fakeId}`);
        
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('ScopeSet not found');
      });
    });

    describe('PUT /scopes/sets/:id', () => {
      it('should update a scope set by id', async () => {
        const scopeSet = new ScopeSet({
          controlId: sampleScopeSets[0].controlId,
          scopes: scopeMap
        });
        await scopeSet.save();

        const updatedData = {
          controlId: sampleScopeSets[1].controlId,
          scopes: Object.fromEntries(sampleScopeSets[1].scopes)
        };

        const response = await request.put(`/scopes/sets/${scopeSet._id}`).send(updatedData);
        
        expect(response.status).toBe(200);
        expect(response.body.controlId).toBe(updatedData.controlId);
        Object.entries(updatedData.scopes).forEach(([key, value]) => {
          expect(response.body.scopes[key]).toBe(value);
        });
      });

      it('should return 404 if scope set not found', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const updatedData = {
          controlId: sampleScopeSets[1].controlId,
          scopes: Object.fromEntries(sampleScopeSets[1].scopes)
        };

        const response = await request.put(`/scopes/sets/${fakeId}`).send(updatedData);
        
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('ScopeSet not found');
      });
    });

    describe('GET /scopes/sets/control/:controlId', () => {
      it('should retrieve scope sets by control id', async () => {
        const scopeSet = new ScopeSet({
          controlId: sampleScopeSets[0].controlId,
          scopes: scopeMap
        });
        await scopeSet.save();

        const response = await request.get(`/scopes/sets/control/${sampleScopeSets[0].controlId}`);
        
        expect(response.status).toBe(200);
        expect(Array.isArray(response.body)).toBe(true);
        expect(response.body.length).toBeGreaterThan(0);
        expect(response.body[0].controlId).toBe(sampleScopeSets[0].controlId);
      });
    });

    describe('DELETE /scopes/sets/control/:controlId', () => {
      it('should delete all scope sets with the specified controlId', async () => {
        // Create a scope set to delete
        const scopeSet = new ScopeSet({
          controlId: sampleScopeSets[0].controlId,
          scopes: scopeMap
        });
        await scopeSet.save();

        // Verify it exists before deletion
        const beforeDelete = await ScopeSet.find({ controlId: sampleScopeSets[0].controlId });
        expect(beforeDelete.length).toBeGreaterThan(0);

        const response = await request.delete(`/scopes/sets/control/${sampleScopeSets[0].controlId}`);
        
        expect(response.status).toBe(204);

        // Verify it was deleted from the database
        const afterDelete = await ScopeSet.find({ controlId: sampleScopeSets[0].controlId });
        expect(afterDelete.length).toBe(0);
      });

      it('should return 404 if no scope sets found with that controlId', async () => {
        // Use a controlId that does not exist in the database
        const nonExistentControlId = 99999;
        
        const response = await request.delete(`/scopes/sets/control/${nonExistentControlId}`);
        
        expect(response.status).toBe(404);
        expect(response.body.error).toBe('No ScopeSets found with that controlId');
      });
    });
  });
});
