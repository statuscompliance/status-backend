import models from '../models/models.js';
import { updateConfigurationsCache } from '../middleware/endpoint.js';

export async function getConfiguration(req, res) {
  try {
    const configuration = await models.Configuration.findAll();
    res.status(200).json(configuration);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get configuration, error: ${error.message}`,
    });
  }
}

export async function getConfigurationByEndpoint(req, res) {
  try {
    const { endpoint } = req.body;

    const configuration = await models.Configuration.findOne({
      where: {
        endpoint: endpoint,
      },
    });
    if (!configuration || configuration.length == 0) {
      return res
        .status(404)
        .json({ message: `Configuration ${endpoint} not found` });
    }
    res.status(200).json(configuration);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get configuration, error: ${error.message}`,
    });
  }
}

export async function updateConfiguration(req, res) {
  try {
    const { endpoint, available } = req.body;

    const configuration = await models.Configuration.findOne({
      where: {
        endpoint: endpoint,
      },
    });

    if (!configuration) {
      return res
        .status(404)
        .json({ message: `Configuration with endpoint ${endpoint} not found` }); // Mejoramos el mensaje
    }

    const configId = configuration.dataValues.id;

    await models.Configuration.update(
      {
        endpoint: endpoint,
        available: available,
      },
      {
        where: {
          id: configId,
        },
      }
    );
    console.log('About to call updateConfigurationsCache');
    await updateConfigurationsCache;

    res.status(200).json({
      message: `Configuration ${configId} updated successfully`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Failed to update configuration, error: ${error.message}`,
    });
  }
}

export async function getAssistantLimit(req, res) {
  try {
    const configuration = await models.Configuration.findOne({
      where: {
        endpoint: '/api/assistant',
      },
    });
    if (!configuration || configuration.length == 0) {
      return res
        .status(404)
        .json({ message: 'Configuration /api/assistant not found' });
    }
    res.status(200).json({ limit: configuration.dataValues.limit });
  } catch (error) {
    res.status(500).json({
      message: `Failed to get configuration, error: ${error.message}`,
    });
  }
}

export async function updateAssistantLimit(req, res) {
  
  try {
    const { limit } = req.params;
    const assistants = await models.Assistant.findAll();
    const configuration = await models.Configuration.findOne({
      where: { endpoint: '/api/assistant' },
    });

    if (!configuration) {
      return res.status(404).json({ message: `Configuration undefined not found` }); // No necesitamos configId aquí si no existe la configuración
    }

    const configId = configuration.dataValues.id;

    if (assistants.length > limit) {
      return res.status(400).json({ message: 'Limit cannot be less than the number of assistants' });
    }

    if (limit < 1) {
      return res.status(400).json({ message: 'Limit cannot be less than 1' });
    }

    await models.Configuration.update(
      {
        endpoint: '/api/assistant',
        limit: limit,
      },
      {
        where: {
          id: configId,
        },
      }
    );

    res.status(200).json({ message: 'Limit updated successfully' });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: `Failed to update configuration, error: ${error.message}`,
    });
  }
}
