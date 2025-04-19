import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  getPoints,
  getPointById,
  deletePointById,
  getPointsByAgreementId,
  deleteAllPoints,
} from '../../../../src/controllers/point.controller.js';
import { models } from '../../../../src/models/models.js';
import { validate as uuidValidate } from 'uuid';

// Helper para crear objetos mock de req/res

function createRes() {
  return {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    end: vi.fn(),
  };
}

const userId = '5f1b7114-b133-487b-9442-2b48bf60807c';
describe('Point Controller Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mock('uuid', () => ({
      validate: vi.fn(() => true),
    }));
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  describe('getPoints', () => {
    it('should return all points with status 200', async () => {
      const mockPoints = [
        { id: userId, name: 'Point A' },
        { id: '2', name: 'Point B' },
      ];
      vi.spyOn(models.Point, 'findAll').mockResolvedValue(mockPoints);

      const req = {};
      const res = createRes();
      await getPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPoints);
      expect(models.Point.findAll).toHaveBeenCalledTimes(1);
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      vi.spyOn(models.Point, 'findAll').mockRejectedValueOnce(mockError);

      const req = {};
      const res = createRes();
      await getPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An error occurred while retrieving the points.',
      });
    });
  });

  describe('getPointById', () => {
    it('should return point by id with status 200', async () => {
      const point = { id: userId, value: 300 };
      vi.spyOn(models.Point, 'findByPk').mockResolvedValue(point);

      // Forzamos que uuid.validate retorne true para que el controlador siga el camino correcto
      uuidValidate.mockReturnValue(true);

      const req = { params: { id: userId } };
      const res = createRes();

      await getPointById(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(point);
    });

    it('should return 400 if id is invalid', async () => {
      const req = { params: { id: 'invalid' } };
      const res = createRes();

      await getPointById(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({ message: 'Invalid point id' });
    });
  });

  it('should return 400 for missing or invalid id', async () => {
    uuidValidate.mockReturnValue(false);
    vi.spyOn(models.Point, 'findByPk').mockResolvedValue(false);
    const reqWithInvalidId = { params: { id: 'invalid-uuid' } };
    const res = createRes();

    await getPointById(reqWithInvalidId, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid point id' });
    expect(models.Point.findByPk).not.toHaveBeenCalled();

    const reqWithMissingId = { params: {} };
    await getPointById(reqWithMissingId, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid point id' });
    expect(models.Point.findByPk).not.toHaveBeenCalled();
  });

  it('should return 404 if point is not found', async () => {
    vi.spyOn(models.Point, 'findByPk').mockResolvedValue(null);
    uuidValidate.mockReturnValue(true);
    const req = { params: { id: userId } };
    const res = createRes();

    await getPointById(req, res);
    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: `Point with id ${userId} not found`,
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    vi.spyOn(models.Point, 'findByPk').mockRejectedValueOnce(mockError);
    uuidValidate.mockReturnValue(true);
    const req = { params: { id: userId } };
    const res = createRes();

    await getPointById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred while retrieving the point.',
    });
  });
});

describe('deletePointById', () => {
  it('should return 204 if point is successfully deleted', async () => {
    vi.spyOn(models.Point, 'destroy').mockResolvedValue(1);
    uuidValidate.mockReturnValue(true);
    const req = { params: { id: userId } };
    const res = createRes();

    await deletePointById(req, res);

    expect(res.status).toHaveBeenCalledWith(204);
    expect(res.end).toHaveBeenCalledTimes(1);
    expect(models.Point.destroy).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('should return 400 for missing or invalid id', async () => {
    uuidValidate.mockReturnValue(false);
    const reqWithInvalidId = { params: { id: 'invalid-uuid' } };
    const res = createRes();

    await deletePointById(reqWithInvalidId, res);

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({ message: 'Invalid point id' });
  });
  it('should return 404 if point to delete is not found', async () => {
    vi.spyOn(models.Point, 'destroy').mockResolvedValue(0);
    uuidValidate.mockReturnValue(true);
    const req = { params: { id: userId } };
    const res = createRes();

    await deletePointById(req, res);

    expect(res.status).toHaveBeenCalledWith(404);
    expect(res.json).toHaveBeenCalledWith({
      message: `Point with id ${userId} not found`,
    });
    expect(models.Point.destroy).toHaveBeenCalledWith({
      where: { id: userId },
    });
  });

  it('should handle errors gracefully', async () => {
    const mockError = new Error('Database error');
    vi.spyOn(models.Point, 'destroy').mockRejectedValueOnce(mockError);
    const req = { params: { id: userId } };
    const res = createRes();

    await deletePointById(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: 'An error occurred while deleting the point.',
    });
  });

  describe('getPointsByAgreementId', () => {
    it('should return points with status 200 for a valid agreement id', async () => {
      const mockPoints = [
        { id: '3', name: 'Point D', agreementId: 'agreement-1' },
      ];
      vi.spyOn(models.Point, 'findAll').mockResolvedValue(mockPoints);
      const req = { params: { tpaId: 'agreement-1' } };
      const res = createRes();

      await getPointsByAgreementId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockPoints);
      expect(models.Point.findAll).toHaveBeenCalledWith({
        where: { agreementId: 'agreement-1' },
      });
    });

    it('should return 400 if agreement id is missing', async () => {
      const req = { params: {} };
      const res = createRes();

      await getPointsByAgreementId(req, res);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        message: 'Missing agreement id',
      });
    });

    it('should return 200 and empty array if no points found for agreement', async () => {
      vi.spyOn(models.Point, 'findAll').mockResolvedValue([]);
      const req = { params: { tpaId: 'non-existent' } };
      const res = createRes();

      await getPointsByAgreementId(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith([]);
      expect(models.Point.findAll).toHaveBeenCalledWith({
        where: { agreementId: 'non-existent' },
      });
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      vi.spyOn(models.Point, 'findAll').mockRejectedValueOnce(mockError);
      const req = { params: { tpaId: 'agreement-1' } };
      const res = createRes();

      await getPointsByAgreementId(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message:
          'An error occurred while retrieving the points for this agreement.',
      });
    });
  });

  describe('deleteAllPoints', () => {
    it('should return 204 if all points are successfully deleted', async () => {
      vi.spyOn(models.Point, 'destroy').mockResolvedValue(2);
      const req = {};
      const res = createRes();

      await deleteAllPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(204);
      expect(res.end).toHaveBeenCalledTimes(1);
      expect(models.Point.destroy).toHaveBeenCalledWith({ where: {} });
    });

    it('should handle errors gracefully', async () => {
      const mockError = new Error('Database error');
      vi.spyOn(models.Point, 'destroy').mockRejectedValueOnce(mockError);
      const req = {};
      const res = createRes();

      await deleteAllPoints(req, res);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        message: 'An error occurred while deleting all points.',
      });
    });
  });
});
