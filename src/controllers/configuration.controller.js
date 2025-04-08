import { updateConfigurationsCache } from '../middleware/endpoint.js';

export async function getConfiguration(req, res, models) {
  try {
    const configuration = await models.Configuration.findAll();
    res.status(200).json(configuration);
  } catch (error) {
    res.status(500).json({
      message: `Failed to get configuration, error: ${error.message}`,
    });
  }
}

export async function getConfigurationByEndpoint(req, res, models) {
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

export async function updateConfiguration(req, res, models) {
  try {
    const { endpoint, available } = req.body;

    if (!endpoint) {
      return res.status(400).json({ message: 'Endpoint is required' });
    }

    const configuration = await models.Configuration.findOne({
      where: { endpoint },
    });

    if (!configuration) {
      return res.status(404).json({ message: `Configuration with endpoint ${endpoint} not found` });
    }

    const [updatedRows] = await models.Configuration.update(
      { available },
      { where: { id: configuration.dataValues.id } }
    );

    await updateConfigurationsCache();
    
    if (updatedRows > 0) {
      return res.status(200).json({ message: `Configuration ${configuration.dataValues.id} updated successfully` });
    } else {
      return res.status(200).json({ message: 'No changes were applied to the configuration' });
    }

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: `Failed to update configuration, error: ${error.message}` });
  }
}

export async function getAssistantLimit(req, res, models) {
  try {
    const configuration = await models.Configuration.findOne({
      where: {
        endpoint: '/api/assistant',
      },
    });
    console.log('Configuration:', configuration);

    if (!configuration) {
      return res
        .status(404)
        .json({ message: 'Configuration /api/assistant not found' });
    }

    const limit = configuration.dataValues.limit;
    console.log('Limit:', limit);

    if (limit === null || limit === undefined) {
      return res
        .status(400)
        .json({ message: 'Assistant limit is not set' });
    }

    res.status(200).json({ limit });

  } catch (error) {
    console.error('Error in getAssistantLimit:', error);
    res.status(500).json({
      message: `Failed to get configuration, error: ${error.message}`,
    });
  }
}

export async function updateAssistantLimit(req, res, models) {
  try {
    const limit = Number(req.params.limit);

    if (!Number.isInteger(limit) || limit < 1 || limit > Number.MAX_SAFE_INTEGER) {
      return res.status(400).json({ message: 'Invalid limit value' });
    }

    const configuration = await models.Configuration.findOne({
      where: { endpoint: '/api/assistant' },
    });

    if (!configuration) {
      return res.status(404).json({ message: 'Configuration undefined not found' });
    }

    const assistants = await models.Assistant.findAll();
    const configId = configuration.dataValues.id;

    if (assistants.length > limit) {
      return res.status(400).json({ message: 'Limit cannot be less than the number of assistants' });
    }

    await models.Configuration.update(
      { endpoint: '/api/assistant', limit: limit },
      { where: { id: configId } }
    );

    res.status(200).json({ message: 'Limit updated successfully' });

  } catch (error) {
    console.error('Error in updateAssistantLimit:', error);
    res.status(500).json({
      message: `Failed to update configuration, error: ${error.message}`,
    });
  }
}
