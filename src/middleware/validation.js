import { validationResult } from 'express-validator';
import { validate as isUUID } from 'uuid';

export const checkIdParam = (req, res, next) => {

  if (!req.params.id) return res.status(400).json({ error: 'Missing required parameter: id' });

  next();

};


export const validateUUID = (paramName) => {

  return (req, res, next) => {

    const paramValue = (req.params && req.params[paramName]) || (req.query && req.query[paramName]) || (req.body && req.body[paramName]);

    if ((!req.params || req.params[paramName] === undefined) &&
      (!req.query || req.query[paramName] === undefined) &&
      (!req.body || req.body[paramName] === undefined)) {
      return res.status(400).json({ error: `Missing parameter: ${paramName}` });
    }

    if (!isUUID(paramValue) && !isGrafanaUID(paramValue)) {
      return res.status(400).json({ error: `Invalid UUID for parameter: ${paramName}` });
    }

    next();
  };
};


export function validateParams(req, res, next) {

  const errors = validationResult(req);

  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  next();
};

export function isGrafanaUID(uid) {

  return /^[a-zA-Z0-9]{12,24}$/.test(uid);

}