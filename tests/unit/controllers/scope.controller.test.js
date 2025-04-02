import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as scopeController from '../../../src/controllers/scope.controller.js';
import Scope from '../../../src/models/scope.model.js';
import ScopeSet from '../../../src/models/scopeSet.model.js';

// Helper para crear objetos mock de req/res
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn(),
    clearCookie: vi.fn(),
    send: vi.fn().mockReturnThis() 
  };
}

describe('Scope Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // Test getAllScopes
  describe('getAllScopes', () => {
    it('should return all scopes with status 200', async () => {
      const mockScopes = [
        { id: 1, name: 'scope1' },
        { id: 2, name: 'scope2' }
      ];

      vi.spyOn(Scope, 'findAll').mockResolvedValue(mockScopes);

      const req = {};  
      const res = createRes();

      await scopeController.getAllScopes(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScopes);
    });

    it('should handle errors gracefully in getAllScopes', async () => {
      vi.spyOn(Scope, 'findAll').mockRejectedValueOnce(new Error('Database error'));

      const req = {};
      const res = createRes();

      await scopeController.getAllScopes(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error retrieving scopes' ,
      });
    }); 
  });
 

  // Test getScopeById
  describe('getScopeById', () => {
    it('should return a scope by ID with status 200', async () => {
      const mockScope = { id: 1, name: 'scope1' };

      vi.spyOn(Scope, 'findByPk').mockResolvedValue(mockScope);

      const req = { params: { id: 1 } };  // Simulamos que el id es 1
      const res = createRes();

      await scopeController.getScopeById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockScope);
    });

    it('should handle errors gracefully in getScopeById', async () => {
      vi.spyOn(Scope, 'findByPk').mockRejectedValueOnce(new Error('Database error'));

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.getScopeById(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error retrieving scope',
      });
    });
  });

  // Test createScope
  describe('createScope', () => {
    it('should create a new scope with status 201', async () => {
      const newScope = { name: 'new_scope', description: 'test', type: 'test', default: 'false' };
      
      vi.spyOn(Scope, 'create').mockResolvedValue(newScope);

      const req = { body: newScope };  // Mock de los datos que se pasan en el body
      const res = createRes();

      await scopeController.createScope(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(newScope);
    });

    it('should handle errors gracefully in createScope', async () => {
      vi.spyOn(Scope, 'create').mockRejectedValueOnce(new Error('Database error'));

      const req = { body: { name: 'new_scope' } };
      const res = createRes();

      await scopeController.createScope(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error creating scope',
      });
    });
  });

  // Test updateScope
  describe('updateScope', () => {
    it('should update a scope with status 200', async () => {
      const updatedScope = { id: 1, name: 'updated_scope' };

      vi.spyOn(Scope, 'update').mockResolvedValue([1]);  // Sequelize devuelve un array [número de registros modificados]
      vi.spyOn(Scope, 'findByPk').mockResolvedValue(updatedScope);

      const req = { params: { id: 1 }, body: { name: 'updated_scope' } };
      const res = createRes();

      await scopeController.updateScope(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(updatedScope);
    });

    it('should handle errors gracefully in updateScope', async () => {
      vi.spyOn(Scope, 'update').mockRejectedValueOnce(new Error('Database error'));

      const req = { params: { id: 1 }, body: { name: 'updated_scope' } };
      const res = createRes();

      await scopeController.updateScope(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error updating scope',
      });
    });
  });

  // Test deleteScope
  describe('deleteScope', () => {
    it('should delete a scope with status 204', async () => {
      vi.spyOn(Scope, 'destroy').mockResolvedValue(1);  // Mock de la respuesta de destroy

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.deleteScope(req, res);

      expect(res.status).toHaveBeenCalledWith(204);  // 204 significa "No Content"
      expect(res.json).not.toHaveBeenCalled();
    });

    it('should handle errors gracefully in deleteScope', async () => {
      vi.spyOn(Scope, 'destroy').mockRejectedValueOnce(new Error('Database error'));

      const req = { params: { id: 1 } };
      const res = createRes();

      await scopeController.deleteScope(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Error deleting scope',
      });
    });
  });

  describe('createScopeSet', () => {

    it('should handle errors gracefully when creating scope set', async () => {
      const req = { body: { controlId: '123', scopes: [] } };
      const res = createRes();

      // Mock the save method to throw an error
      ScopeSet.prototype.save = vi.fn().mockRejectedValue(new Error('Database error'));

      await scopeController.createScopeSet(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ error: 'Database error' });
    });
    /* "_id": "67ed3a909a4dfd02363340cf", 
    it('should create a new scope set and return it with status 201', async () => {
      const mockScopeSet = { controlId: '123', scopes: ['scope1', 'scope2'] };
      const req = { body: mockScopeSet };
      const res = createRes();

      // Mock the save method of ScopeSet
      ScopeSet.prototype.save = vi.fn().mockResolvedValue(mockScopeSet);

      await scopeController.createScopeSet(req, res);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockScopeSet);
    });*/
  });
});