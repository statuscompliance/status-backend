import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import { models } from '../../../src/models/models.js';
import { sampleScopes, newScopeData, invalidScopeData, updatedScopeData } from '../../utils/sampleScopesData.js';

describe('Scope models', () => {
  // Clean up after all tests
  afterAll(async () => {
    await models.Scope.destroy({
      where: { 
        name: [
          newScopeData.name, 
          updatedScopeData.name,
          ...sampleScopes.map(scope => scope.name)
        ] 
      }
    });
  });

  describe('Scope creation', () => {
    let createdScope;
    const testScope = {
      name: 'test_scope',
      description: 'Test scope for integration tests',
      type: 'string',
      default: 'default_value'
    };

    beforeAll(async () => {
      await models.Scope.destroy({
        where: { 
          name: testScope.name
        }
      });
    });

    it('should create a scope correctly in the database', async () => {
      createdScope = await models.Scope.create({
        name: testScope.name,
        description: testScope.description,
        type: testScope.type,
        default: testScope.default
      });
      
      expect(createdScope).toBeDefined();
      expect(createdScope.id).toBeDefined();
      expect(createdScope.name).toBe(testScope.name);
      expect(createdScope.description).toBe(testScope.description);
      expect(createdScope.type).toBe(testScope.type);
      expect(createdScope.default).toBe(testScope.default);
    });

    it('should retrieve the created scope from the database', async () => {
      const retrievedScope = await models.Scope.findOne({
        where: { name: testScope.name }
      });

      expect(retrievedScope).toBeDefined();
      expect(retrievedScope.id).toBe(createdScope.id);
      expect(retrievedScope.name).toBe(testScope.name);
      expect(retrievedScope.description).toBe(testScope.description);
      expect(retrievedScope.type).toBe(testScope.type);
      expect(retrievedScope.default).toBe(testScope.default);
    });

    it('should validate name format properly', async () => {
      try {
        await models.Scope.create(invalidScopeData);
        // If it reaches here, validation didn't fail
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('Name must be in lowercase and spaces replaced with underscores');
      }
    });
  });

  describe('Bulk scope operations', () => {
    beforeAll(async () => {
      // Clean up before tests
      await models.Scope.destroy({
        where: { 
          name: sampleScopes.map(scope => scope.name)
        }
      });
    });

    it('should create multiple scopes in bulk', async () => {
      const createdScopes = await models.Scope.bulkCreate(sampleScopes);
      
      expect(createdScopes).toHaveLength(sampleScopes.length);
      
      for (let i = 0; i < createdScopes.length; i++) {
        expect(createdScopes[i].name).toBe(sampleScopes[i].name);
        expect(createdScopes[i].description).toBe(sampleScopes[i].description);
        expect(createdScopes[i].type).toBe(sampleScopes[i].type);
        expect(createdScopes[i].default).toBe(sampleScopes[i].default);
      }
    });

    it('should find all created scopes', async () => {
      const scopes = await models.Scope.findAll({
        where: {
          name: sampleScopes.map(scope => scope.name)
        }
      });
      
      expect(scopes).toHaveLength(sampleScopes.length);
      
      // Verify each scope is present
      const scopeNames = scopes.map(scope => scope.name);
      for (const sampleScope of sampleScopes) {
        expect(scopeNames).toContain(sampleScope.name);
      }
    });
  });

  describe('Scope update and delete', () => {
    let createdScope;
    
    beforeAll(async () => {
      // Clean up before tests
      await models.Scope.destroy({
        where: { 
          name: [newScopeData.name, updatedScopeData.name]
        }
      });
      
      // Create a scope to modify
      createdScope = await models.Scope.create(newScopeData);
    });
    
    it('should update a scope correctly', async () => {
      // Update the scope
      const [updatedCount] = await models.Scope.update(
        { 
          description: updatedScopeData.description,
          default: updatedScopeData.default 
        },
        { where: { id: createdScope.id } }
      );
      
      expect(updatedCount).toBe(1);
      
      // Retrieve the updated scope
      const updatedScope = await models.Scope.findByPk(createdScope.id);
      
      expect(updatedScope.description).toBe(updatedScopeData.description);
      expect(updatedScope.default).toBe(updatedScopeData.default);
      // The name and type should remain the same
      expect(updatedScope.name).toBe(newScopeData.name);
      expect(updatedScope.type).toBe(newScopeData.type);
    });
    
    it('should delete a scope correctly', async () => {
      // Delete the scope
      const deletedCount = await models.Scope.destroy({
        where: { id: createdScope.id }
      });
      
      expect(deletedCount).toBe(1);
      
      // Verify the scope no longer exists
      const deletedScope = await models.Scope.findByPk(createdScope.id);
      expect(deletedScope).toBeNull();
    });
  });
});
