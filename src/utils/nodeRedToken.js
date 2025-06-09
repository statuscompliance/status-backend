import nodered from '../config/nodered.js';
import logger from '../config/logger.js';

export async function getNodeRedToken(username, password) {
  try {
    const response = await nodered.post('/auth/token', {
      client_id: 'node-red-admin',
      grant_type: 'password',
      scope: '*',
      username: username,
      password: password,
    });
    return response.data.access_token;
  } catch (error) {
    const statusCode = error.response?.status || 500;
    const errorMessage = `Error getting Node-RED token: ${error.message}`;
    
    logger.error(errorMessage, {
      statusCode,
      functionName: 'getNodeRedToken',
      metadata: {
        username,
        errorDetails: error.response?.data || error.message
      }
    });

    const customError = new Error('Failed to get Node-RED token');
    customError.statusCode = statusCode;
    throw customError;
  }
}
