import { logError } from '../config/logger.js';

/**
 * Handles standard errors for API controllers
 * @param {Response} res - Express response object
 * @param {Error} error - Captured error
 * @param {string} defaultMessage - Default message if no specific one is provided
 * @returns {Response} HTTP response with the formatted error
 */
export const handleControllerError = (res, error, defaultMessage = 'Internal server error') => {
  // Log the error with context
  const errorInfo = {
    requestId: res.req?.requestId,
    userId: res.req?.user?.id || 'anonymous',
    ip: res.req?.ip || res.req?.headers?.['x-forwarded-for'] || res.req?.socket?.remoteAddress,
    url: res.req?.originalUrl,
    method: res.req?.method,
    functionName: error.functionName || '',
    lineNumber: error.lineNumber || 0,
  };
  
  logError(error, errorInfo);
  
  // Handle external API errors with response property
  if (error.response) {
    const status = error.response.status || 500;
    const message = error.response.statusText 
      ? `${defaultMessage}: ${error.response.statusText}`
      : defaultMessage;
    const errorMessage = (error.response.data && error.response.data.message) || error.message;

    return res.status(status).json({
      message,
      error: errorMessage,
      requestId: res.req?.requestId,
    });
  }
  
  // Handle internal errors
  return res.status(500).json({
    message: defaultMessage,
    error: error.message,
    requestId: res.req?.requestId,
  });
};
