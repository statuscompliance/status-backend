import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  createServiceAccount,
  getServiceAccountById,
  createServiceAccountToken,
} from '../../../../src/controllers/serviceAccount.controller.js';
import { mockController } from '../../../utils/mockController.js';
import { methods } from '../../../../src/config/grafana.js';

describe('Service Account Controller', () => {
  let mockReq;
  let mockRes;

  beforeEach(() => {
    vi.clearAllMocks();

    mockRes = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    };
  });

  describe('createServiceAccount', () => {
    it('should create a service account and return status 201', async () => {
      mockReq = {
        body: { name: 'test-service-account', role: 'Viewer' }
      };

      const grafanaApiResponse = {
        data: { id: 1, name: 'test-service-account', role: 'Viewer', isDisabled: false, orgId: 1 }
      };

      mockController(methods.serviceAccount, 'createServiceAccount', grafanaApiResponse);

      await createServiceAccount(mockReq, mockRes);

      expect(methods.serviceAccount.createServiceAccount).toHaveBeenCalledTimes(1);
      expect(methods.serviceAccount.createServiceAccount).toHaveBeenCalledWith({
        isDisabled: false, name: 'test-service-account', role: 'Viewer',
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(grafanaApiResponse.data);
    });
    
    it('should handle errors when creating a service account', async () => {
      mockReq = {
        body: { name: 'error-account', role: 'Editor' }
      };

      const error = new Error('Grafana API error: Service account already exists');

      mockController(methods.serviceAccount, 'createServiceAccount', null, error);

      await createServiceAccount(mockReq, mockRes);

      expect(methods.serviceAccount.createServiceAccount).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalled(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Failed to create service account in Grafana',
        error: 'Grafana API error: Service account already exists',
        requestId: undefined,
      });
    });
  });

  describe('getServiceAccountById', () => {
    it('should retrieve a service account by ID and return status 200', async () => {
      mockReq = {
        params: { id: '123' }
      };

      const grafanaApiResponse = {
        data: { id: 123, name: 'existing-service-account', role: 'Admin', isDisabled: false, orgId: 1 }
      };
      mockController(methods.serviceAccount, 'retrieveServiceAccount', grafanaApiResponse);

      await getServiceAccountById(mockReq, mockRes);

      expect(methods.serviceAccount.retrieveServiceAccount).toHaveBeenCalledTimes(1);
      expect(methods.serviceAccount.retrieveServiceAccount).toHaveBeenCalledWith('123');
      expect(mockRes.status).toHaveBeenCalledWith(200);
      expect(mockRes.json).toHaveBeenCalledWith(grafanaApiResponse.data);
    });

    it('should handle errors when retrieving a service account by ID', async () => {
      mockReq = {
        params: { id: 'non-existent-id' }
      };

      const error = new Error('Grafana API error: Service account not found');

      mockController(methods.serviceAccount, 'retrieveServiceAccount', null, error);

      await getServiceAccountById(mockReq, mockRes);

      expect(methods.serviceAccount.retrieveServiceAccount).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalled(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        error: 'Grafana API error: Service account not found',
        message: 'Failed to retrieve service account in Grafana',
        requestId: undefined,
      });
    });
  });

  describe('createServiceAccountToken', () => {
    it('should create a service account token and return status 201', async () => {
      mockReq = {
        params: { id: '456' },
        body: { name: 'test-token', secondsToLive: 3600 }
      };

      const grafanaApiResponse = {
        data: { id: 101, name: 'test-token', key: 'glsa_abcdef1234567890', expiration: '2025-06-12T10:00:00Z' }
      };

      mockController(methods.serviceAccount, 'createToken', grafanaApiResponse);

      await createServiceAccountToken(mockReq, mockRes);

      expect(methods.serviceAccount.createToken).toHaveBeenCalledTimes(1);
      expect(methods.serviceAccount.createToken).toHaveBeenCalledWith('456', {
        name: 'test-token', secondsToLive: 3600,
      });
      expect(mockRes.status).toHaveBeenCalledWith(201);
      expect(mockRes.json).toHaveBeenCalledWith(grafanaApiResponse.data);
    });

    it('should handle errors when creating a service account token', async () => {
      mockReq = {
        params: { id: 'invalid-id' },
        body: { name: 'invalid-token', secondsToLive: 60 }
      };

      const error = new Error('Grafana API error: Service account ID not found');

      mockController(methods.serviceAccount, 'createToken', null, error);

      await createServiceAccountToken(mockReq, mockRes);

      expect(methods.serviceAccount.createToken).toHaveBeenCalledTimes(1);
      expect(mockRes.status).toHaveBeenCalled(500);
      expect(mockRes.json).toHaveBeenCalledWith({
        message: 'Failed to create service account token in Grafana',
        error: 'Grafana API error: Service account ID not found',
        requestId: undefined,
      });
    });
  });
});
