import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createSecretExample } from '../../../utils/sampleSecretsData.js';
import { mockController } from '../../../utils/mockController.js';

// Import everything
import * as secret from '../../../../src/controllers/secret.controller.js';
import { models } from '../../../../src/models/models.js';

// --- Helpers ---
function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    send: vi.fn().mockReturnThis(),
  };
}

function createReq(overrides = {}) {
  return {
    user: {
      user_id: 123, // Changed to number
      username: 'testuser',
    },
    params: {},
    body: {},
    ...overrides,
  };
}

// --- Suite ---
describe('Secret Controller', () => {
  let res;
  const userId = 123; // Changed to number to match database expectations
  const secretId = 456; // Changed to number to match database expectations

  beforeEach(() => {
    vi.clearAllMocks();
    res = createRes();
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('listSecrets', () => {
    it('should return 401 if user is not authenticated', async () => {
      const req = createReq({ user: null });
      
      await secret.listSecrets(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 401 if user_id is missing', async () => {
      const req = createReq({ user: { username: 'testuser' } });
      
      await secret.listSecrets(req, res);
      
      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 200 with sanitized secrets list', async () => {
      const mockSecrets = [
        createSecretExample({
          id: 1,
          name: 'Test Secret 1',
          ownerId: userId,
        }),
        createSecretExample({
          id: 2,
          name: 'Test Secret 2',
          ownerId: userId,
        }),
      ];

      mockController(models.Secret, 'findAll', mockSecrets);
      const req = createReq();

      await secret.listSecrets(req, res);

      expect(models.Secret.findAll).toHaveBeenCalledWith({
        where: { ownerId: userId },
        attributes: { exclude: ['valueEncrypted'] },
      });
      expect(res.json).toHaveBeenCalledWith(
        mockSecrets.map(s => ({
          id: s.id,
          name: s.name,
          type: s.type,
          environment: s.environment,
          createdBy: s.createdBy,
          version: s.version,
          rotatedAt: s.rotatedAt,
          createdAt: s.createdAt,
          updatedAt: s.updatedAt,
          value: '********',
        }))
      );
    });

    it('should return 200 with empty array if no secrets found', async () => {
      mockController(models.Secret, 'findAll', []);
      const req = createReq();

      await secret.listSecrets(req, res);

      expect(res.json).toHaveBeenCalledWith([]);
    });

    it('should return 500 on database error', async () => {
      const mockError = new Error('Database error');
      mockController(models.Secret, 'findAll', null, mockError);
      const req = createReq();

      await secret.listSecrets(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error listing secrets',
        error: 'Database error',
      });
    });
  });

  describe('getSecret', () => {
    it('should return 404 if secret not found', async () => {
      mockController(models.Secret, 'findByPk', null);
      const req = createReq({ params: { id: secretId } });

      await secret.getSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret not found or access denied',
      });
    });

    it('should return 404 if secret belongs to different user', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: 999, // different user
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ params: { id: secretId } });

      await secret.getSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret not found or access denied',
      });
    });

    it('should return 200 with sanitized secret if user owns it', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: userId,
        name: 'My Secret',
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ params: { id: secretId } });

      await secret.getSecret(req, res);

      expect(models.Secret.findByPk).toHaveBeenCalledWith(secretId, {
        attributes: { exclude: ['valueEncrypted'] },
      });
      expect(res.json).toHaveBeenCalledWith({
        id: mockSecret.id,
        name: mockSecret.name,
        type: mockSecret.type,
        environment: mockSecret.environment,
        createdBy: mockSecret.createdBy,
        version: mockSecret.version,
        rotatedAt: mockSecret.rotatedAt,
        createdAt: mockSecret.createdAt,
        updatedAt: mockSecret.updatedAt,
        value: '********',
      });
    });

    it('should return 500 on database error', async () => {
      const mockError = new Error('Database error');
      mockController(models.Secret, 'findByPk', null, mockError);
      const req = createReq({ params: { id: secretId } });

      await secret.getSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error fetching secret',
        error: 'Database error',
      });
    });
  });

  describe('createSecret', () => {
    const secretData = {
      name: 'New Secret',
      type: 'api',
      environment: 'production',
      value: 'secret-value-123',
    };

    it('should return 401 if user is not authenticated', async () => {
      const req = createReq({ user: null, body: secretData });

      await secret.createSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 401 if user_id is missing', async () => {
      const req = createReq({ 
        user: { username: 'testuser' }, 
        body: secretData 
      });

      await secret.createSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ message: 'Unauthorized' });
    });

    it('should return 400 if value is missing', async () => {
      const req = createReq({ 
        body: { ...secretData, value: undefined } 
      });

      await secret.createSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret value is required.',
      });
    });

    it('should return 400 if value is empty string', async () => {
      const req = createReq({ 
        body: { ...secretData, value: '' } 
      });

      await secret.createSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret value is required.',
      });
    });

    it('should return 201 and create secret successfully', async () => {
      const mockCreatedSecret = createSecretExample({
        id: secretId,
        ...secretData,
        valueEncrypted: 'some-encrypted-value',
        createdBy: 'testuser',
        version: 1,
        ownerId: userId,
      });

      mockController(models.Secret, 'create', mockCreatedSecret);
      const req = createReq({ body: secretData });

      await secret.createSecret(req, res);

      // Check that the create function was called with the right parameters
      // In test environment, the controller automatically adds an id field
      expect(models.Secret.create).toHaveBeenCalledWith({
        name: secretData.name,
        type: secretData.type,
        environment: secretData.environment,
        valueEncrypted: expect.any(String), // The encrypted value is generated by the real encrypt function
        createdBy: 'testuser',
        version: 1,
        rotatedAt: expect.any(Date),
        ownerId: userId,
        id: expect.any(Number), // ID is automatically added in test environment
      });
      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret created successfully',
        id: mockCreatedSecret.id,
        name: mockCreatedSecret.name,
        type: mockCreatedSecret.type,
        environment: mockCreatedSecret.environment,
        createdBy: mockCreatedSecret.createdBy,
        version: mockCreatedSecret.version,
        rotatedAt: mockCreatedSecret.rotatedAt,
        createdAt: mockCreatedSecret.createdAt,
        updatedAt: mockCreatedSecret.updatedAt,
        value: secretData.value, // Unmasked in creation response
      });
    });

    it('should return 409 if a secret with the same name already exists for the user', async () => {
      const mockExistingSecret = createSecretExample({
        id: secretId,
        name: secretData.name,
        ownerId: userId,
      });

      // Simula que ya existe un secreto con ese nombre para el usuario
      mockController(models.Secret, 'findOne', mockExistingSecret);
      const req = createReq({ body: secretData });

      await secret.createSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        message: 'A secret with this name already exists.',
      });
    });

    it('should return 500 on database error', async () => {
      const mockError = new Error('Database error');
      mockController(models.Secret, 'create', null, mockError);
      const req = createReq({ body: secretData });

      await secret.createSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error creating secret',
        error: 'Database error',
      });
    });
  });

  describe('updateSecret', () => {
    const updateData = {
      name: 'Updated Secret',
      type: 'database',
      environment: 'staging',
      value: 'new-secret-value',
    };

    it('should return 404 if secret not found', async () => {
      mockController(models.Secret, 'findByPk', null);
      const req = createReq({ 
        params: { id: secretId },
        body: updateData 
      });

      await secret.updateSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret not found or access denied',
      });
    });

    it('should return 404 if secret belongs to different user', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: 999, // different user
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ 
        params: { id: secretId },
        body: updateData 
      });

      await secret.updateSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret not found or access denied',
      });
    });

    it('should update secret metadata without value', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: userId,
        version: 1,
        update: vi.fn().mockResolvedValue({}),
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ 
        params: { id: secretId },
        body: { 
          name: updateData.name,
          type: updateData.type,
          environment: updateData.environment,
        }
      });

      await secret.updateSecret(req, res);

      expect(mockSecret.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Date),
        name: updateData.name,
        type: updateData.type,
        environment: updateData.environment,
      });
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret updated successfully',
        id: mockSecret.id,
        name: mockSecret.name,
        type: mockSecret.type,
        environment: mockSecret.environment,
        createdBy: mockSecret.createdBy,
        version: mockSecret.version,
        rotatedAt: mockSecret.rotatedAt,
        createdAt: mockSecret.createdAt,
        updatedAt: mockSecret.updatedAt,
        value: '********',
      });
    });

    it('should update secret with new value and increment version', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: userId,
        version: 1,
        update: vi.fn().mockResolvedValue({}),
      });
      
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ 
        params: { id: secretId },
        body: updateData 
      });

      await secret.updateSecret(req, res);

      // Check that the update function was called with the right parameters
      expect(mockSecret.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Date),
        name: updateData.name,
        type: updateData.type,
        environment: updateData.environment,
        valueEncrypted: expect.any(String), // The encrypted value is generated by the real encrypt function
        version: 2,
        rotatedAt: expect.any(Date),
      });
    });

    it('should not update value if it is empty or whitespace', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: userId,
        version: 1,
        update: vi.fn().mockResolvedValue({}),
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ 
        params: { id: secretId },
        body: { 
          ...updateData,
          value: '   ', // whitespace only
        }
      });

      await secret.updateSecret(req, res);

      expect(mockSecret.update).toHaveBeenCalledWith({
        updatedAt: expect.any(Date),
        name: updateData.name,
        type: updateData.type,
        environment: updateData.environment,
      });
    });

    it('should return 500 on database error', async () => {
      const mockError = new Error('Database error');
      mockController(models.Secret, 'findByPk', null, mockError);
      const req = createReq({ 
        params: { id: secretId },
        body: updateData 
      });

      await secret.updateSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error updating secret',
        error: 'Database error',
      });
    });
  });

  describe('deleteSecret', () => {
    it('should return 404 if secret not found', async () => {
      mockController(models.Secret, 'findByPk', null);
      const req = createReq({ params: { id: secretId } });

      await secret.deleteSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret not found or access denied',
      });
    });

    it('should return 404 if secret belongs to different user', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: 999, // different user
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ params: { id: secretId } });

      await secret.deleteSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(404);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Secret not found or access denied',
      });
    });

    it('should return 204 on successful deletion', async () => {
      const mockSecret = createSecretExample({
        id: secretId,
        ownerId: userId,
        destroy: vi.fn().mockResolvedValue({}),
      });
      mockController(models.Secret, 'findByPk', mockSecret);
      const req = createReq({ params: { id: secretId } });

      await secret.deleteSecret(req, res);

      expect(mockSecret.destroy).toHaveBeenCalled();
      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.send).toHaveBeenCalled();
    });

    it('should return 500 on database error', async () => {
      const mockError = new Error('Database error');
      mockController(models.Secret, 'findByPk', null, mockError);
      const req = createReq({ params: { id: secretId } });

      await secret.deleteSecret(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Error deleting secret',
        error: 'Database error',
      });
    });
  });
});
