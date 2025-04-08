import { validationResult } from 'express-validator';
import { validate as isUUID } from 'uuid';

export const checkIdParam = (req, res, next) => {
  if (!req.params.id) {
    return res.status(400).json({ error: 'Missing required parameter: id' });
  }
  next();
};

// Middleware to validate a parameter as UUIDv4
export const validateUUID = (paramName) => {
  return (req, res, next) => {
    const paramValue = req.params[paramName] || req.query[paramName] || req.body[paramName];
    if (!paramValue && !isUUID(paramValue) && !isGrafanaUID(paramValue)) {
      return res.status(400).json({ error: `Invalid or missing UUID for parameter: ${paramName}` });
    }
    next();
  };
};


export function validateParams(req, res, next) {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

function isGrafanaUID(uid) {
  return /^[a-zA-Z0-9]{12,24}$/.test(uid);
}
