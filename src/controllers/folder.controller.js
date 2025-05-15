import { methods } from '../config/grafana.js';
import crypto from 'crypto';

export async function getFolders(req, res) {
  try {
    const response = await methods.folder.getFolders();
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve folders in Grafana due to server error',
        error: error.message,
      });
    }
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
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve dashboards in Grafana due to server error',
        error: error.message,
      });
    }
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
    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json(data);
    } else {
      return res.status(500).json({
        message:
                    'Failed to create folder in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function deleteFolder(req, res) {
  try {
    const response = await methods.folder.deleteFolder(req.params.uid);
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status, data } = error.response;
      return res.status(status).json(data);
    } else {
      return res.status(500).json({
        message: 'Failed to delete folder in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function getFolderByUID(req, res) {
  try {
    const response = await methods.folder.getFolderByUID(req.params.uid);
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve folder in Grafana due to server error',
        error: error.message,
      });
    }
  }
}
