import { expect, describe, it, beforeAll, afterAll } from 'vitest';
import { models } from '../../../src/models/models.js';
import { sampleLinkers, newLinkerData, invalidLinkerData, updatedLinkerData } from '../../utils/sampleLinkerData.js';

describe('Linker models', () => {
  let testUserId;

  // Setup: Create a test user before all tests
  beforeAll(async () => {
    const testUser = await models.User.create({
      username: 'linkertestuser',
      email: 'linkertest@example.com',
      password: 'hashedPassword123',
      authority: 'USER'
    });
    testUserId = testUser.id;
  });

  // Clean up after all tests
  afterAll(async () => {
    await models.Linker.destroy({
      where: { 
        name: [
          newLinkerData.name,
          ...sampleLinkers.map(linker => linker.name)
        ] 
      }
    });
    
    await models.User.destroy({
      where: { username: 'linkertestuser' }
    });
  });

  describe('Linker creation', () => {
    let createdLinker;
    const testLinker = {
      name: 'test_linker_creation',
      defaultMethodName: 'default',
      datasourceIds: ['bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb'],
      datasourceConfigs: {
        'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb': {
          id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
          methodConfig: {
            methodName: 'default',
            options: { timeout: 3000 }
          },
          propertyMapping: {
            source: 'target'
          }
        }
      },
      description: 'Test linker for integration tests',
      environment: 'production',
      isActive: true,
      createdBy: 'testuser',
      executionStatus: 'not_executed'
    };

    beforeAll(async () => {
      await models.Linker.destroy({
        where: { 
          name: testLinker.name
        }
      });
    });

    it('should create a linker correctly in the database', async () => {
      createdLinker = await models.Linker.create({
        ...testLinker,
        ownerId: testUserId
      });
      
      expect(createdLinker).toBeDefined();
      expect(createdLinker.id).toBeDefined();
      expect(createdLinker.name).toBe(testLinker.name);
      expect(createdLinker.defaultMethodName).toBe(testLinker.defaultMethodName);
      expect(createdLinker.datasourceIds).toEqual(testLinker.datasourceIds);
      expect(createdLinker.datasourceConfigs).toEqual(testLinker.datasourceConfigs);
      expect(createdLinker.description).toBe(testLinker.description);
      expect(createdLinker.environment).toBe(testLinker.environment);
      expect(createdLinker.isActive).toBe(testLinker.isActive);
      expect(createdLinker.createdBy).toBe(testLinker.createdBy);
      expect(createdLinker.version).toBe(1);
      expect(createdLinker.executionStatus).toBe(testLinker.executionStatus);
      expect(createdLinker.ownerId).toBe(testUserId);
    });

    it('should retrieve the created linker from the database', async () => {
      const retrievedLinker = await models.Linker.findOne({
        where: { name: testLinker.name }
      });

      expect(retrievedLinker).toBeDefined();
      expect(retrievedLinker.id).toBe(createdLinker.id);
      expect(retrievedLinker.name).toBe(testLinker.name);
      expect(retrievedLinker.defaultMethodName).toBe(testLinker.defaultMethodName);
      expect(retrievedLinker.datasourceIds).toEqual(testLinker.datasourceIds);
      expect(retrievedLinker.description).toBe(testLinker.description);
      expect(retrievedLinker.ownerId).toBe(testUserId);
    });

    it('should validate datasourceIds is not empty', async () => {
      try {
        await models.Linker.create({
          ...invalidLinkerData,
          ownerId: testUserId
        });
        // If it reaches here, validation didn't fail
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('datasourceIds must contain at least one datasource ID');
      }
    });

    it('should validate datasourceIds is an array', async () => {
      try {
        await models.Linker.create({
          name: 'invalid_array_linker',
          defaultMethodName: 'default',
          datasourceIds: 'not-an-array',
          description: 'Invalid linker',
          environment: 'production',
          isActive: true,
          createdBy: 'testuser',
          ownerId: testUserId
        });
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.message).toContain('datasourceIds must be an array');
      }
    });

    it('should reject creating a linker with null datasourceConfigs', async () => {
      try {
        await models.Linker.create({
          name: 'null_config_linker',
          defaultMethodName: 'default',
          datasourceIds: ['cccccccc-cccc-cccc-cccc-cccccccccccc'],
          datasourceConfigs: null,
          description: 'Linker with null config',
          environment: 'dev',
          isActive: true,
          createdBy: 'testuser',
          ownerId: testUserId
        });
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toBe('SequelizeValidationError');
      }
    });

    afterAll(async () => {
      await models.Linker.destroy({
        where: { 
          name: testLinker.name
        }
      });
    });
  });

  describe('Bulk linker operations', () => {
    beforeAll(async () => {
      // Clean up before tests
      await models.Linker.destroy({
        where: { 
          name: sampleLinkers.map(linker => linker.name)
        }
      });
    });

    it('should create multiple linkers in bulk', async () => {
      const linkersWithOwner = sampleLinkers.map(linker => ({
        ...linker,
        ownerId: testUserId
      }));

      const createdLinkers = await models.Linker.bulkCreate(linkersWithOwner);
      
      expect(createdLinkers).toHaveLength(sampleLinkers.length);
      
      for (let i = 0; i < createdLinkers.length; i++) {
        expect(createdLinkers[i].name).toBe(sampleLinkers[i].name);
        expect(createdLinkers[i].defaultMethodName).toBe(sampleLinkers[i].defaultMethodName);
        expect(createdLinkers[i].datasourceIds).toEqual(sampleLinkers[i].datasourceIds);
        expect(createdLinkers[i].description).toBe(sampleLinkers[i].description);
        expect(createdLinkers[i].environment).toBe(sampleLinkers[i].environment);
        expect(createdLinkers[i].isActive).toBe(sampleLinkers[i].isActive);
        expect(createdLinkers[i].ownerId).toBe(testUserId);
      }
    });

    it('should find all created linkers', async () => {
      const linkers = await models.Linker.findAll({
        where: {
          name: sampleLinkers.map(linker => linker.name)
        }
      });
      
      expect(linkers).toHaveLength(sampleLinkers.length);
      
      // Verify each linker is present
      const linkerNames = linkers.map(linker => linker.name);
      for (const sampleLinker of sampleLinkers) {
        expect(linkerNames).toContain(sampleLinker.name);
      }
    });

    it('should filter linkers by environment', async () => {
      const productionLinkers = await models.Linker.findAll({
        where: {
          environment: 'production',
          name: sampleLinkers.map(linker => linker.name)
        }
      });

      expect(productionLinkers.length).toBeGreaterThan(0);
      productionLinkers.forEach(linker => {
        expect(linker.environment).toBe('production');
      });
    });

    it('should filter linkers by isActive status', async () => {
      const activeLinkers = await models.Linker.findAll({
        where: {
          isActive: true,
          name: sampleLinkers.map(linker => linker.name)
        }
      });

      expect(activeLinkers.length).toBeGreaterThan(0);
      activeLinkers.forEach(linker => {
        expect(linker.isActive).toBe(true);
      });
    });
  });

  describe('Linker update and delete', () => {
    let createdLinker;
    
    beforeAll(async () => {
      // Clean up before tests
      await models.Linker.destroy({
        where: { 
          name: newLinkerData.name
        }
      });
      
      // Create a linker to modify
      createdLinker = await models.Linker.create({
        ...newLinkerData,
        ownerId: testUserId
      });
    });
    
    it('should update a linker correctly', async () => {
      // Update the linker
      const [updatedCount] = await models.Linker.update(
        { 
          description: updatedLinkerData.description,
          defaultMethodName: updatedLinkerData.defaultMethodName,
          isActive: updatedLinkerData.isActive,
          version: updatedLinkerData.version,
          executionStatus: updatedLinkerData.executionStatus
        },
        { where: { id: createdLinker.id } }
      );
      
      expect(updatedCount).toBe(1);
      
      // Retrieve the updated linker
      const updatedLinker = await models.Linker.findByPk(createdLinker.id);
      
      expect(updatedLinker.description).toBe(updatedLinkerData.description);
      expect(updatedLinker.defaultMethodName).toBe(updatedLinkerData.defaultMethodName);
      expect(updatedLinker.isActive).toBe(updatedLinkerData.isActive);
      expect(updatedLinker.version).toBe(updatedLinkerData.version);
      expect(updatedLinker.executionStatus).toBe(updatedLinkerData.executionStatus);
      // The name should remain the same
      expect(updatedLinker.name).toBe(newLinkerData.name);
    });

    it('should update lastExecutedAt timestamp', async () => {
      const executionTime = new Date();
      
      await models.Linker.update(
        { 
          lastExecutedAt: executionTime,
          executionStatus: 'success'
        },
        { where: { id: createdLinker.id } }
      );
      
      const updatedLinker = await models.Linker.findByPk(createdLinker.id);
      
      expect(updatedLinker.lastExecutedAt).toBeDefined();
      expect(new Date(updatedLinker.lastExecutedAt).getTime()).toBeCloseTo(executionTime.getTime(), -3);
      expect(updatedLinker.executionStatus).toBe('success');
    });
    
    it('should delete a linker correctly', async () => {
      // Delete the linker
      const deletedCount = await models.Linker.destroy({
        where: { id: createdLinker.id }
      });
      
      expect(deletedCount).toBe(1);
      
      // Verify the linker no longer exists
      const deletedLinker = await models.Linker.findByPk(createdLinker.id);
      expect(deletedLinker).toBeNull();
    });
  });

  describe('Linker associations', () => {
    let testLinker;

    beforeAll(async () => {
      await models.Linker.destroy({
        where: { name: 'association_test_linker' }
      });

      testLinker = await models.Linker.create({
        name: 'association_test_linker',
        defaultMethodName: 'default',
        datasourceIds: ['dddddddd-dddd-dddd-dddd-dddddddddddd'],
        datasourceConfigs: {
          'dddddddd-dddd-dddd-dddd-dddddddddddd': {
            id: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
            methodConfig: {
              methodName: 'default',
              options: {}
            },
            propertyMapping: {}
          }
        },
        description: 'Linker for association tests',
        environment: 'production',
        isActive: true,
        createdBy: 'testuser',
        ownerId: testUserId
      });
    });

    it('should have a valid ownerId reference', async () => {
      const linker = await models.Linker.findByPk(testLinker.id);
      expect(linker.ownerId).toBe(testUserId);
    });

    it('should enforce unique constraint on name and ownerId', async () => {
      try {
        await models.Linker.create({
          name: 'association_test_linker', // Same name as existing
          defaultMethodName: 'default',
          datasourceIds: ['eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee'],
          datasourceConfigs: {
            'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee': {
              id: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee',
              methodConfig: {
                methodName: 'default',
                options: {}
              },
              propertyMapping: {}
            }
          },
          description: 'Duplicate linker',
          environment: 'production',
          isActive: true,
          createdBy: 'testuser',
          ownerId: testUserId // Same owner
        });
        expect(true).toBe(false); // Force test to fail
      } catch (error) {
        expect(error).toBeDefined();
        expect(error.name).toBe('SequelizeUniqueConstraintError');
      }
    });

    afterAll(async () => {
      await models.Linker.destroy({
        where: { name: 'association_test_linker' }
      });
    });
  });

  describe('Linker execution status', () => {
    let statusLinker;

    beforeAll(async () => {
      await models.Linker.destroy({
        where: { name: 'status_test_linker' }
      });

      statusLinker = await models.Linker.create({
        name: 'status_test_linker',
        defaultMethodName: 'default',
        datasourceIds: ['ffffffff-ffff-ffff-ffff-ffffffffffff'],
        datasourceConfigs: {
          'ffffffff-ffff-ffff-ffff-ffffffffffff': {
            id: 'ffffffff-ffff-ffff-ffff-ffffffffffff',
            methodConfig: {
              methodName: 'default',
              options: {}
            },
            propertyMapping: {}
          }
        },
        description: 'Linker for status tests',
        environment: 'production',
        isActive: true,
        createdBy: 'testuser',
        ownerId: testUserId
      });
    });

    it('should have default executionStatus as not_executed', async () => {
      expect(statusLinker.executionStatus).toBe('not_executed');
    });

    it('should update executionStatus to success', async () => {
      await models.Linker.update(
        { executionStatus: 'success' },
        { where: { id: statusLinker.id } }
      );

      const updatedLinker = await models.Linker.findByPk(statusLinker.id);
      expect(updatedLinker.executionStatus).toBe('success');
    });

    it('should update executionStatus to failure', async () => {
      await models.Linker.update(
        { executionStatus: 'failure' },
        { where: { id: statusLinker.id } }
      );

      const updatedLinker = await models.Linker.findByPk(statusLinker.id);
      expect(updatedLinker.executionStatus).toBe('failure');
    });

    it('should update executionStatus to pending', async () => {
      await models.Linker.update(
        { executionStatus: 'pending' },
        { where: { id: statusLinker.id } }
      );

      const updatedLinker = await models.Linker.findByPk(statusLinker.id);
      expect(updatedLinker.executionStatus).toBe('pending');
    });

    afterAll(async () => {
      await models.Linker.destroy({
        where: { name: 'status_test_linker' }
      });
    });
  });
});
