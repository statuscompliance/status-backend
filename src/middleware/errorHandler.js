import { CacheLoadError, ConfigurationNotFoundError, AssistantFetchError } from './endpoint.js';

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  console.error('Error:', err);

  if (err instanceof CacheLoadError || 
      err instanceof ConfigurationNotFoundError || 
      err instanceof AssistantFetchError) {
    return res.status(err.statusCode).json({
      message: err.name,
      error: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  
  return res.status(statusCode).json({
    message: err.name || 'Internal server error',
    error: process.env.NODE_ENV === 'production' ? 'Something went wrong' : err.message
  });
}
