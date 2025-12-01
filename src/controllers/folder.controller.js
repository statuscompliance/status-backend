import { methods } from '../config/grafana.js';
import crypto from 'node:crypto';
import { handleControllerError } from '../utils/errorHandler.js';

export async function getFolders(req, res) {
  try {
    const response = await methods.folder.getFolders();
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve folders in Grafana');
  }
}

export async function getFolderDashboardsByUID(req, res) {
  try {
    const folderUid = req.params.uid === '{uid}' ? '' : req.params.uid;
    const response = await methods.search.search(
      undefined,
      undefined,
      'dash-db',
      undefined,
      undefined,
      undefined,
      folderUid,
      undefined,
      undefined
    );
    const dashboards = response.data.filter((dashboard) =>
      folderUid === '' ? !dashboard.folderUid : true
    );
    return res.status(200).json(dashboards);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve dashboards in Grafana');
  }
}

export async function createFolder(req, res) {
  try {
    const newUID = crypto.randomUUID();
    const {title, parentUid , description } = req.body;
    const response = await methods.folder.createFolder({
      newUID,
      title,
      parentUid,
      description
    });
    return res.status(201).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create folder in Grafana');
  }
}

export async function deleteFolder(req, res) {
  try {
    const response = await methods.folder.deleteFolder(req.params.uid);
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to delete folder in Grafana');
  }
}

export async function getFolderByUID(req, res) {
  try {
    const response = await methods.folder.getFolderByUID(req.params.uid);
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve folder in Grafana');
  }
}
