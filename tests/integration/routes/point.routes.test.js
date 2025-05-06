import { expect, describe, vi, it, beforeAll, afterAll } from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { sampleUser } from '../../utils/sampleUserData.js';
import { models } from '../../../src/models/models.js';
import { createPointExample } from '../../utils/createPointExample.js';
import { v4 as uuidv4 } from 'uuid';

const getResponse = (path, token) => {
  return request
    .get(path)
    .set('Cookie', `accessToken=${token}`);
};

const nonExistentId = uuidv4();
const point1 = createPointExample({ agreementId: 'AG-001' });
const point2 = createPointExample({ agreementId: 'AG-002' });
const samplePoints = [point1, point2]

describe('Point API Routes', () => {
  let getToken;

  beforeAll(async () => {
    getToken = jwt.sign(
      {
        userId: sampleUser._id,
        username: sampleUser.username,
        authority: sampleUser.authority,
      },
      'test-secret-key'
    );
  
    await models.Point.bulkCreate(samplePoints);

    vi.spyOn(console, 'error').mockImplementation(() => {});
    
  });
  afterAll(async () => {
    await models.Point.destroy({ where: {}, truncate: true });
  });

  describe('getPoints /', () => {
    const getPath = '/points';
    it('should return 200 and a list of all points for an admin user', async () => {
        
      const response = await getResponse(getPath, getToken);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('agreementId');
      
    });
  });
  describe('getPointById /', () => {
    const getPathWithId = (id) => `/points/${id}`;
    it('should return 200 and the correct point for a valid ID', async () => {
        
      const response = await getResponse(getPathWithId(point1.id), getToken);

      expect(response.status).toBe(200);
      expect(response.body.agreementId).toBe('AG-001');
      expect(response.body).toHaveProperty('createdAt');
      expect(response.body).toHaveProperty('updatedAt');
      expect(new Date(response.body.createdAt).getTime()).toBeGreaterThan(0);
      expect(new Date(response.body.updatedAt).getTime()).toBeGreaterThan(0);
      
    });
    it('should return 400 for an invalid point ID format', async () => {
      const invalidId = 'invalid-id';
      const response = await getResponse(getPathWithId(invalidId), getToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid point id');      
    });
    it('should return 404 if the point ID does not exist', async () => {
      const response = await getResponse(getPathWithId(nonExistentId), getToken);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', `Point with id ${nonExistentId} not found` );      
    });
  });
  // getPointsByAgreementId
  describe('getPointsByAgreementId /catalog/:tpaId', () => {
    const getPathWithId = (tpaId) => `/points/catalog/${tpaId}`; 
    it('should return 200 and all points for the given agreement ID', async () => {
        
      const response = await getResponse(getPathWithId(point2.agreementId), getToken);

      expect(response.status).toBe(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('agreementId', point2.agreementId);
      expect(response.body[0]).toHaveProperty('id', point2.id);
    });
    it('should return 400 if the tpaId parameter is missing', async () => {
      const invalidParams = '';
      const response = await getResponse(getPathWithId(invalidParams), getToken);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid point id');
    });
    it('should return 200 and an empty array if no points are found for the agreement ID', async () => {
      const response = await getResponse(getPathWithId(nonExistentId), getToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });
  });
  describe('deletePointById /:id', () => {
    const deletePathWithId = (id) => `/points/${id}`;

    it('should delete a point and return 204', async () => {
      const response = await request
        .delete(deletePathWithId(point1.id))
        .set('Cookie', `accessToken=${getToken}`);

      expect(response.status).toBe(204);

      const deleted = await models.Point.findByPk(point1.id);
      expect(deleted).toBeNull();
    });

    it('should return 404 if the point does not exist', async () => {
      const response = await request
        .delete(deletePathWithId(nonExistentId))
        .set('Cookie', `accessToken=${getToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('message', `Point with id ${nonExistentId} not found`);
    });

    it('should return 400 if id is invalid', async () => {
      const response = await request
        .delete(deletePathWithId('invalid-id'))
        .set('Cookie', `accessToken=${getToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid point id');
    });
  });

  describe('deleteAllPoints /', () => {
    const deleteAllPath = '/points';

    it('should delete all points and return 204', async () => {

      const response = await request
        .delete(deleteAllPath)
        .set('Cookie', `accessToken=${getToken}`);

      expect(response.status).toBe(204);

      const remainingPoints = await models.Point.findAll();
      expect(remainingPoints.length).toBe(0);
    });
  });
});
