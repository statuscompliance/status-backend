import models from '../../db/models.js'

export async function getConfiguration(req, res) {
    try {
        const configuration = await models.Configuration.findAll();
        res.status(200).json(configuration);
    } catch (error) {
        res.status(500).json({ message: `Failed to get configuration, error: ${error.message}` });
    }   
}

export async function getConfigurationByEndpoint(req, res) {
    try {
        const { endpoint } = req.body;

        const configuration = await models.Configuration.findOne({
            where: {
                endpoint: endpoint
            }
        });
        if (configuration.length === 0) {
            return res.status(404).json({ message: `Configuration ${endpoint} not found` });
        }
        res.status(200).json(configuration);
    } catch (error) {
        res.status(500).json({ message: `Failed to get configuration, error: ${error.message}` });
    }
}

export async function updateConfiguration(req, res) {
    try {
        const { endpoint, available } = req.body;

        const configuration = await models.Configuration.findOne({
            where: {
                endpoint: endpoint
            }
        });
        const configId = configuration.dataValues.id;

        if (configuration.length === 0) {
            return res.status(404).json({ message: `Configuration ${configId} not found` });
        }
        await models.Configuration.update({
            endpoint: endpoint,
            available: available
        }, {
            where: {
                id: configId
            }
        });

        res.status(200).json({ message: `Configuration ${configId} updated successfully` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: `Failed to update configuration, error: ${error.message}` });
    }
}