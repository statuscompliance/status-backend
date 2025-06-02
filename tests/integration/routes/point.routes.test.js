import { expect, describe, vi, it, beforeAll, afterAll } from 'vitest';
import { request } from '../../setup/setup.js';
import jwt from 'jsonwebtoken';
import { sampleUser } from '../../utils/sampleUserData.js';
import { models } from '../../../src/models/models.js';
import { createPointExample } from '../../utils/createPointExample.js';
import { v4 as uuidv4 } from 'uuid';

// Helpers para token y rutas
const buildToken = (user = sampleUser) =>
  jwt.sign(
    {
      userId: user._id,
      username: user.username,
      authority: user.authority,
    },
    'test-secret-key'
  );

const withToken = (req, token) => req.set('Cookie', `accessToken=${token}`);
const routes = {
  points: '/points',
  pointById: (id) => `/points/${id}`,
  pointsByAgreement: (tpaId) => `/points/catalog/${tpaId}`,
  pointsByComputationGroup: (cgId) => `/points/computationGroup/${cgId}`,
};

const getResponse = (path, token) => withToken(request.get(path), token);

const nonExistentId = uuidv4();
const point1 = createPointExample({ agreementId: 'AG-001' });
const point2 = createPointExample({ agreementId: 'AG-002' });
const samplePoints = [point1, point2];

describe('Point API Routes', () => {
  let getToken;

  beforeAll(async () => {
    getToken = buildToken();
    await models.Point.bulkCreate(samplePoints);
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterAll(async () => {
    await models.Point.destroy({ where: {}, truncate: true });
  });

  describe('getPoints /', () => {
    it('should return 200 and a list of all points for an admin user', async () => {
      const response = await getResponse(routes.points, getToken);
      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThan(0);
      expect(response.body[0]).toHaveProperty('agreementId');
    });
  });

  describe('getPointById /', () => {
    const cases = [
      {
        name: 'should return 200 and the correct point for a valid ID',
        id: point1.id,
        expectedStatus: 200,
        validate: (body) => {
          expect(body.agreementId).toBe('AG-001');
          expect(body).toHaveProperty('createdAt');
          expect(body).toHaveProperty('updatedAt');
          expect(new Date(body.createdAt).getTime()).toBeGreaterThan(0);
          expect(new Date(body.updatedAt).getTime()).toBeGreaterThan(0);
        },
      },
      {
        name: 'should return 400 for an invalid point ID format',
        id: 'invalid-id',
        expectedStatus: 400,
        validate: (body) => {
          expect(body).toHaveProperty('message', 'Invalid point id');
        },
      },
      {
        name: 'should return 404 if the point ID does not exist',
        id: nonExistentId,
        expectedStatus: 404,
        validate: (body) => {
          expect(body).toHaveProperty('message', `Point with id ${nonExistentId} not found`);
        },
      },
    ];

    cases.forEach(({ name, id, expectedStatus, validate }) => {
      it(name, async () => {
        const response = await getResponse(routes.pointById(id), getToken);
        expect(response.status).toBe(expectedStatus);
        validate(response.body);
      });
    });
  });

  describe('getPointsByAgreementId /catalog/:tpaId', () => {
    const cases = [
      {
        name: 'should return 200 and all points for the given agreement ID',
        tpaId: point2.agreementId,
        expectedStatus: 200,
        validate: (body) => {
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBeGreaterThan(0);
          expect(body[0]).toHaveProperty('agreementId', point2.agreementId);
          expect(body[0]).toHaveProperty('id', point2.id);
        },
      },
      {
        name: 'should return 400 if the tpaId parameter is missing',
        tpaId: '',
        expectedStatus: 400,
        validate: (body) => {
          expect(body).toHaveProperty('message', 'Invalid point id');
        },
      },
      {
        name: 'should return 200 and an empty array if no points are found for the agreement ID',
        tpaId: nonExistentId,
        expectedStatus: 200,
        validate: (body) => {
          expect(Array.isArray(body)).toBe(true);
          expect(body.length).toBe(0);
        },
      },
    ];

    cases.forEach(({ name, tpaId, expectedStatus, validate }) => {
      it(name, async () => {
        const response = await getResponse(routes.pointsByAgreement(tpaId), getToken);
        expect(response.status).toBe(expectedStatus);
        validate(response.body);
      });
    });
  });

  describe('deletePointById /:id', () => {
    const cases = [
      {
        name: 'should delete a point and return 204',
        id: point1.id,
        expectedStatus: 204,
        validate: async () => {
          const deleted = await models.Point.findByPk(point1.id);
          expect(deleted).toBeNull();
        },
      },
      {
        name: 'should return 404 if the point does not exist',
        id: nonExistentId,
        expectedStatus: 404,
        validate: (body) => {
          expect(body).toHaveProperty('message', `Point with id ${nonExistentId} not found`);
        },
      },
      {
        name: 'should return 400 if id is invalid',
        id: 'invalid-id',
        expectedStatus: 400,
        validate: (body) => {
          expect(body).toHaveProperty('message', 'Invalid point id');
        },
      },
    ];

    cases.forEach(({ name, id, expectedStatus, validate }) => {
      it(name, async () => {
        const response = await withToken(request.delete(routes.pointById(id)), getToken);
        expect(response.status).toBe(expectedStatus);
        if (expectedStatus === 204) {
          await validate();
        } else {
          validate(response.body);
        }
      });
    });
  });

  describe('deleteAllPoints /', () => {
    it('should delete all points and return 204', async () => {
      const response = await withToken(request.delete(routes.points), getToken);
      expect(response.status).toBe(204);

      const remainingPoints = await models.Point.findAll();
      expect(remainingPoints.length).toBe(0);
    });
  });

  describe('updatePointByComputationGroup /computationGroup/:computationGroup', () => {
    let cgPoint1, cgPoint2, computationGroupId;
    beforeAll(async () => {
      computationGroupId = uuidv4();
      cgPoint1 = createPointExample({ computationGroup: computationGroupId, agreementId: 'CG-001' });
      cgPoint2 = createPointExample({ computationGroup: computationGroupId, agreementId: 'CG-002' });
      await models.Point.bulkCreate([cgPoint1, cgPoint2]);
    });

    it('should update points by computation group and return 200', async () => {
      const updateData = { status: 'completed', guaranteeResult: true };
      const response = await withToken(
        request.put(routes.pointsByComputationGroup(computationGroupId)).send(updateData),
        getToken
      );
      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Points updated successfully');
      expect(Array.isArray(response.body.points)).toBe(true);
      expect(response.body.points.length).toBe(2);
      response.body.points.forEach((point) => {
        expect(point.computationGroup).toBe(computationGroupId);
        expect(point.guaranteeResult).toBe(true);
      });
    });

    it('should return 400 for invalid computation group id', async () => {
      const response = await withToken(
        request.put(routes.pointsByComputationGroup('invalid-id')).send({ status: 'fail' }),
        getToken
      );
      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('message', 'Invalid computation group id');
    });

    it('should return 404 if no points found for computation group', async () => {
      const nonExistentCG = uuidv4();
      const response = await withToken(
        request.put(routes.pointsByComputationGroup(nonExistentCG)).send({ status: 'fail' }),
        getToken
      );
      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty(
        'message',
        `No points found with computation group ${nonExistentCG}`
      );
    });

    it('should handle server errors gracefully', async () => {
      // Simula error en el modelo
      const spy = vi.spyOn(models.Point, 'findAll').mockRejectedValueOnce(new Error('DB error'));
      const response = await withToken(
        request.put(routes.pointsByComputationGroup(computationGroupId)).send({ status: 'fail' }),
        getToken
      );
      expect(response.status).toBe(500);
      expect(response.body).toHaveProperty('message');
      spy.mockRestore();
    });
  });
});
