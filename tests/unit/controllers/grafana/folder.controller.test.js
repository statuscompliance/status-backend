import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getFolders,
  getFolderDashboardsByUID,
  createFolder,
  deleteFolder,
  getFolderByUID,
} from '../../../../src/controllers/folder.controller.js';
import { mockController } from '../../../utils/mockController.js';
import { methods } from '../../../../src/config/grafana.js';
import * as errorHandler from '../../../../src/utils/errorHandler.js';
import crypto from 'crypto';

describe('Grafana: Folder Controller', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: { uid: '' },
      body: {}
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn()
    };
    vi.clearAllMocks();
  });

  describe('getFolders', () => {
    it('should return folders correctly', async () => {
      const mockData = [{ id: 1, title: 'Folder 1' }];
      mockController(methods.folder, 'getFolders', { data: mockData });

      await getFolders(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockData);
    });

    it('should handle errors properly', async () => {
      const error = new Error('Error fetching folders');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.folder, 'getFolders', null, error);

      await getFolders(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to retrieve folders in Grafana');
    });
  });

  describe('getFolderDashboardsByUID', () => {
    it('should return dashboards for a folder UID', async () => {
      const mockDashboards = [{ id: 1 }];
      mockController(methods.search, 'search', { data: mockDashboards });

      req.params.uid = 'abc';

      await getFolderDashboardsByUID(req, res);

      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockDashboards);
    });

    it('should handle errors properly', async () => {
      const error = new Error('Error fetching dashboards');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.search, 'search', null, error);

      await getFolderDashboardsByUID(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to retrieve dashboards in Grafana');
    });
  });

  describe('createFolder', () => {
    it('should create a folder successfully', async () => {
      const mockResponse = { id: 1, title: 'New Folder' };
      const fakeUID = 'mock-uid-123';

      vi.spyOn(crypto, 'randomUUID').mockReturnValue(fakeUID);

      req.body = {
        title: 'New Folder',
        parentUid: 'parent-123',
        description: 'Test folder'
      };

      mockController(methods.folder, 'createFolder', { data: mockResponse });

      await createFolder(req, res);

      expect(methods.folder.createFolder).toHaveBeenCalledWith({
        newUID: fakeUID,
        title: 'New Folder',
        parentUid: 'parent-123',
        description: 'Test folder'
      });

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle errors properly', async () => {
      const error = new Error('Error creating folder');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.folder, 'createFolder', null, error);

      await createFolder(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to create folder in Grafana');
    });
  });

  describe('deleteFolder', () => {
    it('should delete a folder successfully', async () => {
      const mockResponse = { message: 'Deleted' };
      req.params.uid = 'folder-uid';
      mockController(methods.folder, 'deleteFolder', { data: mockResponse });

      await deleteFolder(req, res);

      expect(methods.folder.deleteFolder).toHaveBeenCalledWith('folder-uid');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle errors properly', async () => {
      const error = new Error('Error deleting folder');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.folder, 'deleteFolder', null, error);

      await deleteFolder(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to delete folder in Grafana');
    });
  });

  describe('getFolderByUID', () => {
    it('should retrieve a folder by UID', async () => {
      const mockResponse = { id: 1, title: 'Folder A' };
      req.params.uid = 'folder-123';
      mockController(methods.folder, 'getFolderByUID', { data: mockResponse });

      await getFolderByUID(req, res);

      expect(methods.folder.getFolderByUID).toHaveBeenCalledWith('folder-123');
      expect(res.status).toHaveBeenCalledWith(200);
      expect(res.json).toHaveBeenCalledWith(mockResponse);
    });

    it('should handle errors properly', async () => {
      const error = new Error('Error retrieving folder');
      const spy = vi.spyOn(errorHandler, 'handleControllerError');
      mockController(methods.folder, 'getFolderByUID', null, error);

      await getFolderByUID(req, res);

      expect(spy).toHaveBeenCalledWith(res, error, 'Failed to retrieve folder in Grafana');
    });
  });
});
