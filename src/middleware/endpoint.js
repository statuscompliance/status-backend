import models from '../../db/models.js'
import jwt from 'jsonwebtoken'


export async function endpointAvailable(req, res, next) {
    const configurations = await models.Configuration.findAll();
    const endpoint = req.url;
    const matchingConfig = configurations.find(config => endpoint.includes(config.dataValues.endpoint) || config.dataValues.endpoint.includes(endpoint));
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


export function changeAvailability(req, res, next){
    if(req.headers['authorization'] === undefined && req.headers['Authorization'] === undefined) {
        return res.status(401).json({ message: 'No token provided' })
    } else {
        const accessToken = req.headers['authorization'].split(' ')[1] || req.headers['Authorization'].split(' ')[1];
        try {
            const decoded = jwt.verify(accessToken, process.env.JWT_SECRET)
            const authority = decoded.authority
            if (authority === 'ADMIN') {
                next()
            } else {
                return res.status(403).json({ message: 'Forbidden' })
            }
        } catch (error) {
            return res.status(401).json({ message: `Unauthorized, ${error}` })
        }
    }
};