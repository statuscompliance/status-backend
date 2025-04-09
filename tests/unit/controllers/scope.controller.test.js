import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as scopeController from '../../../src/controllers/scope.controller.js';
import { models } from '../../../src/models/models.js';
import ScopeSet from '../../../src/models/scopeSet.model.js';

// Helper para crear objetos mock de req/res
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    send: vi.fn().mockReturnThis(),
  };
}

describe('Scope Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getAllScopes', () => {
    it('should return all scopes with status 200', async () => {
      // Mock data
      const mockScopes = [
        { id: 1, name: 'scope1' },
        { id: 2, name: 'scope2' },
      ];

      vi.spyOn(models.Scope, 'findAll').mockResolvedValue(mockScopes);

      const req = {};
      const res = createRes();

      await scopeController.getAllScopes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScopes);
    });

    it('should handle errors gracefully in getAllScopes', async () => {
      // Mock error
      vi.spyOn(models.Scope, 'findAll').mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = {};
      const res = createRes();

      await scopeController.getAllScopes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve scopes',
      });
    });
  });

  describe('getScopeById', () => {
    it('should return a scope by ID with status 200', async () => {
      // Mock data
      const mockScope = { id: 1, name: 'scope1' };

      vi.spyOn(models.Scope, 'findByPk').mockResolvedValue(mockScope);

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.getScopeById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScope);
    });

    it('should handle errors gracefully in getScopeById', async () => {
      // Mock error
      vi.spyOn(models.Scope, 'findByPk').mockRejectedValueOnce(
        new Error('Failed to retrieve scope set by ID')
      );
  
      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.getScopeById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to retrieve scope by ID',
      });
    });
    it('should return 404 if scope not found', async () => {
      vi.spyOn(models.Scope, 'findByPk').mockResolvedValue(null);

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.getScopeById(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Scope not found' });
    });
    it('should return 400 if an error occurs during creation', async () => {
      vi.spyOn(models.Scope, 'create').mockRejectedValue(new Error('DB error'));
  
      const req = { body: { name: 'scope1', description: 'desc', type: 't', default: false } };
      const res = createRes();
  
      await scopeController.createScope(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to create scope' });
    });
  });

  describe('createScope', () => {
    it('should create a new scope with status 201', async () => {
      const inputBody = {
        name: 'New Scope',
        description: 'desc',
        type: 'type',
        default: false };

      // Mock data
      const newScope = {
        name: 'new_scope', // normalized name
        description: 'desc',
        type: 'type',
        default: false,
      };

      vi.spyOn(models.Scope, 'create').mockResolvedValue(newScope);

      const req = { body: inputBody }; // Mock of data passed in the body.
      const res = createRes();

      await scopeController.createScope(req, res);
      // Check that the name was normalized
      expect(models.Scope.create).toHaveBeenCalledWith(newScope);
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newScope);
    });

    it('should handle errors in createScope', async () => {
      // Mock error
      vi.spyOn(models.Scope, 'create').mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = { body: { name: 'new_scope' } };
      const res = createRes();

      await scopeController.createScope(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to create scope',
      });
    });
    it('should return 400 if name is missing or invalid', async () => {
      const req = { body: { description: 'desc', type: 't', default: false } };
      const res = createRes();
  
      await scopeController.createScope(req, res);
  
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name must be a string' });
    });
  });

  describe('updateScope', () => {
    it('should update a scope with status 200', async () => {
      // Mock data
      const updatedScope = { id: 1, name: 'updated_scope' };

      vi.spyOn(models.Scope, 'update').mockResolvedValue([1]); // Sequelize returns an array [number of records modified]
      vi.spyOn(models.Scope, 'findByPk').mockResolvedValue(updatedScope);

      const req = { params: { id: 1 }, body: { name: 'updated_scope' } };
      const res = createRes();

      await scopeController.updateScope(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedScope);
    });

    it('should return 400 if name is missing or not a string', async () => {
      const req = { params: { id: 1 }, body: { name: 123 } };
      const res = createRes();

      await scopeController.updateScope(req, res);
      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ error: 'Name must be a string' });
    });

    it('should handle errors in updateScope', async () => {
      // Mock error
      vi.spyOn(models.Scope, 'update').mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = { params: { id: 1 }, body: { name: 'updated_scope' } };
      const res = createRes();

      await scopeController.updateScope(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to update scope',
      });
    });
    it('should return 404 if update returns 0 (scope not found)', async () => {
      vi.spyOn(models.Scope, 'update').mockResolvedValue([0]);

      const req = { params: { id: 1 }, body: { name: 'ScopeTest' } };
      const res = createRes();

      await scopeController.updateScope(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Scope not found' });
    });

    it('should return 404 if updated scope is not found after update', async () => {
      vi.spyOn(models.Scope, 'update').mockResolvedValue([1]);
      vi.spyOn(models.Scope, 'findByPk').mockResolvedValue(null);

      const req = { params: { id: 1 }, body: { name: 'ScopeTest' } };
      const res = createRes();

      await scopeController.updateScope(req, res);
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Scope not found after update' });
    });

  });

  describe('deleteScope', () => {
    it('should delete a scope with status 204', async () => {
      // Mock destroy response
      vi.spyOn(models.Scope, 'destroy').mockResolvedValue(1);

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.deleteScope(req, res);

      expect(res.status).toHaveBeenCalledWith(204); // No Content
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully in deleteScope', async () => {
      // Mock error
      vi.spyOn(models.Scope, 'destroy').mockRejectedValueOnce(
        new Error('Database error')
      );

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.deleteScope(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to delete scope',
      });
    });
    it('should return 500 if an error occurs during deletion', async () => {
      const req = { params: { id: '123' } };
      const res = createRes();
  
      // Simular error en la eliminación
      vi.spyOn(models.Scope, 'destroy').mockRejectedValue(new Error('DB error'));
  
      await scopeController.deleteScope(req, res);
  
      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to delete scope' });
    });
    it('should return 404 if scope not found', async () => {
      const req = { params: { id: 1 } };
      const res = createRes();
  
      // Simular que no se elimina ningún registro
      vi.spyOn(models.Scope, 'destroy').mockResolvedValue(0);
  
      await scopeController.deleteScope(req, res);
  
      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'Scope not found' });
    });
  });

  describe('createScopeSet', () => {
    it('should handle errors gracefully when creating scope set', async () => {
      const req = { body: { controlId: 123, scopes: [] } };
      const res = createRes();

      // Mock save method to throw error
      ScopeSet.prototype.save = vi
        .fn()
        .mockRejectedValue(new Error('Database error'));

      await scopeController.createScopeSet(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to create scope set',
      });
    });
    it('should create a new scope set and return it with status 201', async () => {
      // Mock data
      const mockScopes = new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ]);
      // Mock the save method to return a new scope set
      const mockScopeSetWithoutId = {
        controlId: 123,
        scopes: mockScopes, // scopes is a Map in the assertion mock
      };
      // Mock the saved scope set
      const mockSavedScopeSet = {
        _id: 'cualquierIdGenerado',
        controlId: 123,
        scopes: mockScopes, // Mock the save with a Map
      };
      const req = {
        body: {
          controlId: 123,
          scopes: { key1: 'value1', key2: 'value2' },
        },
      };
      const res = createRes();
      // Mock the save method to return the saved scope set
      vi.spyOn(ScopeSet.prototype, 'save').mockResolvedValue(mockSavedScopeSet);

      await scopeController.createScopeSet(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledOnce();
      const responseBody = res.json.mock.calls[0][0];

      // No _id is verified here
      expect(responseBody).toHaveProperty(
        'controlId',
        mockScopeSetWithoutId.controlId
      );
      expect(responseBody).toHaveProperty('scopes');
      expect(responseBody.scopes).toBeInstanceOf(Map);
      expect(responseBody.scopes.get('key1')).toBe('value1');
      expect(responseBody.scopes.get('key2')).toBe('value2');
      
    });

    it('should handle errors gracefully when saving the scope set', async () => {
      const req = {
        body: {
          controlId: 123,
          scopes: { key1: 'value1' },
        },
      };
      const res = createRes();

      vi.spyOn(ScopeSet.prototype, 'save').mockRejectedValue(
        new Error('Database error')
      );

      await scopeController.createScopeSet(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Failed to create scope set',
      });
    });
  });
  describe('getAllScopeSets', () => {
    it('should return all scope sets with status 200', async () => {
      const mockScopeSets = [
        { _id: '1', controlId: 1 },
        { _id: '2', controlId: 2 },
      ];
      vi.spyOn(ScopeSet, 'find').mockResolvedValue(mockScopeSets);

      const req = {}; // No body or specific parameters 
      const res = createRes();

      await scopeController.getAllScopeSets(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScopeSets);
    });
    it('should handle errors gracefully in getAllScopeSets', async () => {
      vi.spyOn(ScopeSet, 'find').mockRejectedValue(new Error('Database error'));

      const req = {};
      const res = createRes();

      await scopeController.getAllScopeSets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to retrieve all scope sets' });
    });
  });
  describe('getScopeSetsByControlId', () => {
    it('should return scope sets by controlId with status 200', async () => {
      const mockControlId = '123';
      const mockScopeSets = [
        { _id: '3', controlId: mockControlId, scopes: new Map() },
      ];
      vi.spyOn(ScopeSet, 'find').mockResolvedValue(mockScopeSets);

      const req = { params: { controlId: mockControlId } };
      const res = createRes();

      await scopeController.getScopeSetsByControlId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScopeSets);
    });

    it('should handle errors gracefully in getScopeSetsByControlId', async () => {
      const mockControlId = '123';
      vi.spyOn(ScopeSet, 'find').mockRejectedValue(new Error('Database error'));

      const req = { params: { controlId: mockControlId } };
      const res = createRes();

      await scopeController.getScopeSetsByControlId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to retrieve scope sets by control ID' });
    });
  });
  describe('updateScopeSetById', () => {
    it('should update a scope set by ID with status 200', async () => {
      const mockId = 'someId';
      const mockUpdateData = {
        controlId: 456,
        scopes: new Map([['key3', 'value3']]),
      };
      const mockUpdatedScopeSet = { _id: mockId, ...mockUpdateData };
      vi.spyOn(ScopeSet, 'findByIdAndUpdate').mockResolvedValue(
        mockUpdatedScopeSet
      );

      const req = { params: { id: mockId }, body: mockUpdateData };
      const res = createRes();

      await scopeController.updateScopeSetById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockUpdatedScopeSet);
    });

    it('should return 404 if scope set to update is not found', async () => {
      const mockId = 'someId';
      const mockUpdateData = { controlId: 456, scopes: new Map() };
      vi.spyOn(ScopeSet, 'findByIdAndUpdate').mockResolvedValue(null);

      const req = { params: { id: mockId }, body: mockUpdateData };
      const res = createRes();

      await scopeController.updateScopeSetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'ScopeSet not found' });
    });
  });
  it('should handle errors gracefully in updateScopeSetById', async () => {
    const mockId = 'someId';
    const mockUpdateData = { controlId: 456, scopes: new Map() };
    vi.spyOn(ScopeSet, 'findByIdAndUpdate').mockRejectedValue(
      new Error('Database error')
    );

    const req = { params: { id: mockId }, body: mockUpdateData };
    const res = createRes();

    await scopeController.updateScopeSetById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ error: 'Failed to update scope set by ID' });
  });
  describe('getScopeSetById', () => {
    it('should return a scope set by ID with status 200', async () => {
      const mockId = 'someId';
      const mockScopeSet = {
        _id: mockId,
        controlId: 123,
        scopes: new Map([['key1', 'value1']]),
      };
      vi.spyOn(ScopeSet, 'findById').mockResolvedValue(mockScopeSet);

      const req = { params: { id: mockId } };
      const res = createRes();

      await scopeController.getScopeSetById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScopeSet);
    });

    it('should return 404 if scope set is not found', async () => {
      const mockId = 'someId';
      vi.spyOn(ScopeSet, 'findById').mockResolvedValue(null);

      const req = { params: { id: mockId } };
      const res = createRes();

      await scopeController.getScopeSetById(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({ error: 'ScopeSet not found' });
    });

    it('should handle errors gracefully in getScopeSetById', async () => {
      const mockId = 'someId';
      vi.spyOn(ScopeSet, 'findById').mockRejectedValue(
        new Error('Database error')
      );

      const req = { params: { id: mockId } };
      const res = createRes();

      await scopeController.getScopeSetById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Failed to retrieve scope set by ID' });
    });
  });
});
