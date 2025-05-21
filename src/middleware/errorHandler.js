import { logError } from '../config/logger.js';

export const errorHandler = (err, req, res) => {
  const statusCode = err.statusCode || 500;
  
  // Extract relevant information for error logging
  const errorInfo = {
    requestId: req.requestId,
    userId: req.user?.id || 'anonymous',
    ip: req.ip || req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    url: req.originalUrl,
    method: req.method,
    statusCode: statusCode,
    functionName: err.functionName || '',
    lineNumber: err.lineNumber || 0,
  };
  
  // Log the error
  logError(err, errorInfo);
  
  // Respond to the client
  res.status(statusCode).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'An error occurred on the server' 
      : err.message,
    requestId: req.requestId, // Include the request ID so the client can report it
  });
};
