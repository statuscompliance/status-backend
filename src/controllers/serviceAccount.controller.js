import { methods } from '../config/grafana.js';
import { handleControllerError } from '../utils/errorHandler.js';

export async function createServiceAccount(req, res) {
  try {
    const { name, role } = req.body;
    const serviceAccountData = {
      isDisabled: false,
      name: name,
      role: role,
    };

    const response = await methods.serviceAccount.createServiceAccount(
      serviceAccountData
    );

    return res.status(201).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create service account in Grafana');
  }
}

export async function getServiceAccountById(req, res) {
  try {
    const response = await methods.serviceAccount.retrieveServiceAccount(
      req.params.id
    );
    return res.status(200).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to retrieve service account in Grafana');
  }
}

export async function createServiceAccountToken(req, res) {
  try {
    const tokenData = {
      name: req.body.name,
      secondsToLive: req.body.secondsToLive,
    };
    const response = await methods.serviceAccount.createToken(
      req.params.id,
      tokenData
    );
    return res.status(201).json(response.data);
  } catch (error) {
    return handleControllerError(res, error, 'Failed to create service account token in Grafana');
  }
}
