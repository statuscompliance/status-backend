import { methods } from '../config/grafana.js';

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
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to create service account in Grafana due to server error',
        error: error.message,
      });
    }
  }
}

export async function getServiceAccountById(req, res) {
  try {
    const response = await methods.serviceAccount.retrieveServiceAccount(
      req.params.id
    );
    return res.status(200).json(response.data);
  } catch (error) {
    if (error.response) {
      const { status } = error.response;
      return res.status(status).json(error);
    } else {
      return res.status(500).json({
        message:
                    'Failed to retrieve service account in Grafana due to server error',
        error: error.message,
      });
    }
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
    if (error.response) {
      const { status } = error.response;
      const errorData = error.response.data ? error.response.data : error;
      return res.status(status).json(errorData);
    } else {
      return res.status(500).json({
        message:
                    'Failed to create service account token in Grafana due to server error',
        error: error.message,
      });
    }
  }
}
