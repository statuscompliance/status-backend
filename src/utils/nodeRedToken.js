import nodered from '../config/nodered.js';

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
    console.error('Error in refreshAccessToken:', error);
    throw new Error('Failed to get Node-RED token');
  }
}
