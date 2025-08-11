import { expect, describe, vi, it, beforeAll, afterAll } from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { sampleUser, adminUser } from '../../utils/sampleUserData.js';
import { models } from '../../../src/models/models.js';
import { createSecretExample } from '../../utils/sampleSecretsData.js';
import { v4 as uuidv4 } from 'uuid';

// Helpers para token y rutas
const buildToken = (user = sampleUser) =>
  jwt.sign(
    {
      user_id: user.id,
      username: user.username,
      authority: user.authority,
    },
    'test-secret-key'
  );

const withToken = (req, token) => req.set('Cookie', `accessToken=${token}`);
const routes = {
  secrets: '/secrets',
  secretById: (id) => `/secrets/${id}`,
};

const nonExistentId = uuidv4();
const getResponse = (path, token) => withToken(request.get(path), token);

describe('Secret API Routes', () => {
  let userToken;
  let secret1, secret2, otherUserSecret;
  let testUserId = 1;
  let testAdminId = 2;

  beforeAll(async () => {

    // Crear usuarios en la base de datos
    await models.User.create({
      id: testUserId,
      username: sampleUser.username,
      email: sampleUser.email,
      password: 'hashedPassword',
      authority: sampleUser.authority
    });

    await models.User.create({
      id: testAdminId,
      username: adminUser.username,
      email: adminUser.email,
      password: 'hashedAdminPassword',
      authority: adminUser.authority
    });

    // Crear tokens para usuario normal
    userToken = buildToken({ ...sampleUser, id: testUserId });

    // Crear secretos de ejemplo
    secret1 = createSecretExample({
      id: uuidv4(),
      name: 'Database Password',
      type: 'PASSWORD',
      environment: 'production',
      ownerId: testUserId,
      createdBy: sampleUser.username
    });

    secret2 = createSecretExample({
      id: uuidv4(),
      name: 'API Key',
      type: 'API_KEY',
      environment: 'development',
      ownerId: testUserId,
      createdBy: sampleUser.username
    });

    // Secreto de otro usuario para probar ownership
    otherUserSecret = createSecretExample({
      id: uuidv4(),
      name: 'Other User Secret',
      type: 'TOKEN',
      environment: 'production',
      ownerId: testAdminId,
      createdBy: adminUser.username
    });

    // Insertar secretos en la base de datos
    await models.Secret.bulkCreate([secret1, secret2, otherUserSecret]);

    // Mock console.error para tests
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    // Limpiar base de datos después de las pruebas
    await models.Secret.destroy({ where: {}, truncate: true });
    await models.User.destroy({ where: {}, force: true });
    vi.restoreAllMocks();
  });

  describe('GET /secrets - listSecrets', () => {
    it('should return 200 and list of secrets owned by the authenticated user', async () => {
      const response = await getResponse(routes.secrets, userToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(2);

      // Verificar que todos los secretos pertenecen al usuario
      response.body.forEach((secret) => {
        expect(secret.value).toBe('********'); // Valor enmascarado
        expect(secret).toHaveProperty('id');
        expect(secret).toHaveProperty('name');
        expect(secret).toHaveProperty('type');
        expect(secret).toHaveProperty('environment');
        expect(secret).toHaveProperty('createdBy');
        expect(secret).toHaveProperty('version');
        expect(secret).toHaveProperty('createdAt');
        expect(secret).toHaveProperty('updatedAt');
        expect(secret).not.toHaveProperty('ownerId');
      });
    });

    it('should return 401 if user is not authenticated', async () => {
      const response = await request.get(routes.secrets);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
    });
  });

  describe('GET /secrets/:id - getSecret', () => {
    it('should return 200 and the secret for a valid ID owned by the user', async () => {
      const response = await getResponse(routes.secretById(secret1.id), userToken);

      expect(response.status).toBe(200);
      expect(response.body.id).toBe(secret1.id);
      expect(response.body.name).toBe(secret1.name);
      expect(response.body.type).toBe(secret1.type);
      expect(response.body.environment).toBe(secret1.environment);
      expect(response.body.value).toBe('********'); // Valor enmascarado
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).not.toHaveProperty('ownerId');
    });

    it('should return 404 if secret is not owned by the user', async () => {
      const response = await getResponse(routes.secretById(otherUserSecret.id), userToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Secret not found or access denied');
    });

    it('should return 404 if secret does not exist', async () => {
      //const nonExistentId = 99999;
      const response = await getResponse(routes.secretById(nonExistentId), userToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Secret not found or access denied');
    });
  });

  describe('POST /secrets - createSecret', () => {
    it('should create a new secret and return 201', async () => {
      const newSecretData = {
        name: 'New API Key',
        type: 'API_KEY',
        environment: 'staging',
        value: 'super-secret-api-key-123'
      };
      const normalizedName = newSecretData.name.toLowerCase().replace(/\s+/g, '_');
      const response = await withToken(request.post(routes.secrets), userToken)
        .send(newSecretData);

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('message', 'Secret created successfully');
      expect(response.body.name).toBe(normalizedName);
      expect(response.body.type).toBe(newSecretData.type);
      expect(response.body.environment).toBe(newSecretData.environment);
      expect(response.body.value).toBe(newSecretData.value); // Valor sin enmascarar en creación
      expect(response.body.createdBy).toBe(sampleUser.username);
      expect(response.body.version).toBe(1);
      expect(response.body).toHaveProperty('id');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(response.body).not.toHaveProperty('ownerId');
    });

    it('should return 400 if value is missing', async () => {
      const incompleteData = {
        name: 'Incomplete Secret',
        type: 'API_KEY',
        environment: 'production'
        // value missing
      };

      const response = await withToken(request.post(routes.secrets), userToken)
        .send(incompleteData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Secret value is required.');
    });

    it('should return 400 if value is empty string', async () => {
      const emptyValueData = {
        name: 'Empty Secret',
        type: 'API_KEY',
        environment: 'production',
        value: ''
      };

      const response = await withToken(request.post(routes.secrets), userToken)
        .send(emptyValueData);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Secret value is required.');
    });

    it('should return 401 if user is not authenticated', async () => {
      const secretData = {
        name: 'Unauthorized Secret',
        type: 'API_KEY',
        environment: 'production',
        value: 'secret-value'
      };

      const response = await request.post(routes.secrets).send(secretData);

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('message', 'No token provided');
    });
  });

  describe('PATCH /secrets/:id - updateSecret', () => {
    it('should update secret metadata and return 200', async () => {
      const updateData = {
        name: 'Updated Database Password',
        type: 'PASSWORD',
        environment: 'staging'
      };

      const response = await withToken(request.patch(routes.secretById(secret1.id)), userToken)
        .send(updateData);

      const normalizedName = updateData.name.toLowerCase().replace(/\s+/g, '_');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Secret updated successfully');
      expect(response.body.name).toBe(normalizedName);
      expect(response.body.type).toBe(updateData.type);
      expect(response.body.environment).toBe(updateData.environment);
      expect(response.body.version).toBe(1); // Version no cambia sin rotación
      expect(response.body.value).toBe('********'); // Valor enmascarado
    });

    it('should rotate secret value and increment version', async () => {
      const updateData = {
        value: 'new-rotated-secret-value'
      };

      const response = await withToken(request.patch(routes.secretById(secret2.id)), userToken)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Secret updated successfully');
      expect(response.body.version).toBe(2); // Version incrementada
      expect(response.body.value).toBe('********'); // Valor enmascarado
      expect(response.body).toHaveProperty('rotatedAt');
    });

    it('should update both metadata and value', async () => {
      const updateData = {
        name: 'Updated API Key',
        value: 'updated-api-key-value'
      };

      const response = await withToken(request.patch(routes.secretById(secret1.id)), userToken)
        .send(updateData);

      const normalizedName = updateData.name.toLowerCase().replace(/\s+/g, '_');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Secret updated successfully');
      expect(response.body.name).toBe(normalizedName);
      expect(response.body.version).toBe(2); // Version incrementada por rotación
    });

    it('should return 404 if secret is not owned by the user', async () => {
      const updateData = { name: 'Unauthorized Update' };

      const response = await withToken(request.patch(routes.secretById(otherUserSecret.id)), userToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Secret not found or access denied');
    });

    it('should return 404 if secret does not exist', async () => {
      const updateData = { name: 'Non-existent Secret' };

      const response = await withToken(request.patch(routes.secretById(nonExistentId)), userToken)
        .send(updateData);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Secret not found or access denied');
    });

    it('should not increment version if value is whitespace only', async () => {
      const updateData = {
        name: 'Whitespace Test',
        value: '   '
      };

      const response = await withToken(request.patch(routes.secretById(secret2.id)), userToken)
        .send(updateData);

      expect(response.status).toBe(400);
      expect(response.body).toEqual({
        message: 'Secret value cannot be an empty string or whitespace.',
      });
    });
  });

  describe('DELETE /secrets/:id - deleteSecret', () => {
    it('should delete a secret and return 204', async () => {
      const response = await withToken(request.delete(routes.secretById(secret1.id)), userToken);

      expect(response.status).toBe(204);
      expect(response.body).toEqual({});

      // Verificar que el secreto fue eliminado
      const deletedSecret = await models.Secret.findByPk(secret1.id);
      expect(deletedSecret).toBeNull();
    });

    it('should return 404 if secret is not owned by the user', async () => {
      const response = await withToken(request.delete(routes.secretById(otherUserSecret.id)), userToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Secret not found or access denied');
    });

    it('should return 404 if secret does not exist', async () => {
      //const nonExistentId = 99999;
      const response = await withToken(request.delete(routes.secretById(nonExistentId)), userToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', 'Secret not found or access denied');
    });
  });

  describe('Error handling', () => {
    it('should handle database errors gracefully in listSecrets', async () => {
      const spy = vi.spyOn(models.Secret, 'findAll').mockRejectedValueOnce(new Error('DB connection error'));

      const response = await getResponse(routes.secrets, userToken);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error listing secrets');
      expect(response.body).toHaveProperty('error');

      spy.mockRestore();
    });

    it('should handle database errors gracefully in getSecret', async () => {
      const spy = vi.spyOn(models.Secret, 'findByPk').mockRejectedValueOnce(new Error('DB connection error'));

      const response = await getResponse(routes.secretById(secret2.id), userToken);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error fetching secret');
      expect(response.body).toHaveProperty('error');

      spy.mockRestore();
    });

    it('should handle database errors gracefully in createSecret', async () => {
      const spy = vi.spyOn(models.Secret, 'create').mockRejectedValueOnce(new Error('DB connection error'));

      const secretData = {
        name: 'Error Test Secret',
        type: 'API_KEY',
        environment: 'production',
        value: 'test-value'
      };

      const response = await withToken(request.post(routes.secrets), userToken)
        .send(secretData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error creating secret');
      expect(response.body).toHaveProperty('error');

      spy.mockRestore();
    });

    it('should handle database errors gracefully in updateSecret', async () => {
      const spy = vi.spyOn(models.Secret, 'findByPk').mockRejectedValueOnce(new Error('DB connection error'));

      const updateData = { name: 'Error Test Update' };

      const response = await withToken(request.patch(routes.secretById(secret2.id)), userToken)
        .send(updateData);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error updating secret');
      expect(response.body).toHaveProperty('error');

      spy.mockRestore();
    });

    it('should handle database errors gracefully in deleteSecret', async () => {
      const spy = vi.spyOn(models.Secret, 'findByPk').mockRejectedValueOnce(new Error('DB connection error'));

      const response = await withToken(request.delete(routes.secretById(secret2.id)), userToken);

      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message', 'Error deleting secret');
      expect(response.body).toHaveProperty('error');

      spy.mockRestore();
    });
  });
});
