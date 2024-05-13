import models from '../../db/models.js';

let configurationsCache = null;

export async function updateConfigurationsCache() {
    configurationsCache = await models.Configuration.findAll();
}

export async function endpointAvailable(req, res, next) {
    if (!configurationsCache) {
        await updateConfigurationsCache();
    } 
    const endpoint = req.url;
    const matchingConfig = configurationsCache.find(config =>
        endpoint.includes(config.dataValues.endpoint) || config.dataValues.endpoint.includes(endpoint)
    );
    if (matchingConfig === undefined) {
        return res.status(404).json({ message: 'Endpoint not found' });
    } else {
        if (matchingConfig.dataValues.available) {
            next();
        } else {
            res.status(404).send('Endpoint not available');
        }
    }
};

export async function assistantlimitReached(req, res, next) {
    if (!configurationsCache) {
        await updateConfigurationsCache();
    }
    const matchingConfig = await models.Configuration.findOne({ where: { endpoint: '/api/assistant' } });
    if (matchingConfig === undefined) {
        return res.status(404).json({ message: 'Endpoint not found' });
    } else {
        const assistants = await models.Assistant.findAll();
        if(assistants){
            if (matchingConfig.dataValues.limit <= assistants.length) {
                res.status(429).send('Limit reached');
            } else {
                next();
            }
        } else{
            next();
        }
    }
}