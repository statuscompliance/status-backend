import axios from 'axios';
import logger from '../../../src/config/logger';
import 'dotenv/config';

const NODE_RED_HOST = process.env.NODE_RED_HOST; // Change to your Node-RED host if not running locally
const NODE_RED_PORT = process.env.NODE_RED_PORT; // Default Node-RED port
const NODE_RED_URL = `http://${NODE_RED_HOST}:${NODE_RED_PORT}`;
// Default credentials for Node-RED Admin API
const NODE_RED_USER = process.env.NODE_RED_USER;
const NODE_RED_PASSWORD = process.env.NODE_RED_PASSWORD;
// Basic Auth header for Node-RED Admin API
const BASIC_AUTH_HEADER = 'Basic ' + Buffer.from(`${NODE_RED_USER}:${NODE_RED_PASSWORD}`).toString('base64');

let nodeRedAuthToken = '';
let nodeRedApi = null;

/**
 * Checks the status of the Node-RED instance.
 * @returns {Promise<boolean>} True if Node-RED is reachable and responds with a 200 status, false otherwise.
 */
export async function connectNodeRed() {
  logger.debug('Connecting to Node-RED Admin API...');
  try {
    nodeRedAuthToken = await authenticateNodeRed();
    logger.debug('Node-RED authentication token obtained:', nodeRedAuthToken);
    nodeRedApi = axios.create({
      baseURL: NODE_RED_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeRedAuthToken}`,
      },
    });
    const response = await nodeRedApi.get('/');
    return response.status === 200;
  } catch (error) {
    logger.error('Error connecting to Node-RED Admin API:', error.message);
    return false;
  }
}

async function authenticateNodeRed() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  for (let i = 0; i < MAX_RETRIES; i++) {
    logger.debug(`Attempting to authenticate with Node-RED Admin API... (Attempt ${i + 1}/${MAX_RETRIES})`);
    try {
      const tokenResponse = await axios.post(`${NODE_RED_URL}/auth/token`, new URLSearchParams({
        client_id: 'node-red-admin',
        grant_type: 'password',
        scope: '*',
        username: NODE_RED_USER,
        password: NODE_RED_PASSWORD,
      }).toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        timeout: 10000
      });

      if (tokenResponse.data && tokenResponse.data.access_token) {
        logger.debug('Node-RED authentication successful. Token obtained.');
        return tokenResponse.data.access_token;
      } else {
        logger.warn(`Authentication attempt ${i + 1} failed: No access_token found in response data. Retrying...`);
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        logger.warn(`Authentication attempt ${i + 1} failed. Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}. Retrying...`);
        if (error.response.status === 401 || error.response.status === 403) {
          logger.error('Authentication failed due to incorrect credentials or permissions. Aborting retries.');
          throw new Error(`Node-RED authentication failed: Invalid credentials or insufficient permissions. Status: ${error.response.status}`);
        }
      } else if (axios.isAxiosError(error) && error.request) {
        logger.warn(`Authentication attempt ${i + 1} failed: No response received. Retrying...`);
      } else {
        logger.error(`Error during authentication attempt ${i + 1}: ${error.message}. Retrying...`);
      }
    }
    if (i < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw new Error(`Failed to authenticate with Node-RED after ${MAX_RETRIES} attempts.`);
}

async function waitForFlowEndpointReady(endpointUrl, timeoutMs = 20000, intervalMs = 250) {
  const startTime = Date.now();
  const fullUrl = `${NODE_RED_URL}${endpointUrl}`;
  logger.debug(`[Flow Endpoint Check] Waiting for flow endpoint '${fullUrl}' to be ready...`);

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await axios.get(fullUrl, { timeout: 2000 }); 
      logger.debug(`[Flow Endpoint Check] Endpoint '${fullUrl}' responded with status: ${response.status}. Considering it ready.`);
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          logger.debug(`[Flow Endpoint Check] Endpoint '${fullUrl}' still 404. Retrying...`);
        } else {
          logger.debug(`[Flow Endpoint Check] Endpoint '${fullUrl}' responded with ${error.response.status}. Assuming it's active.`);
          return true;
        }
      } else if (axios.isAxiosError(error) && error.request) {
        logger.debug(`[Flow Endpoint Check] Endpoint '${fullUrl}' no response. Retrying...`);
      } else {
        logger.warn(`[Flow Endpoint Check] Unexpected error checking endpoint '${fullUrl}': ${error.message}. Retrying...`);
      }
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }
  logger.error(`[Flow Endpoint Check] Flow endpoint '${fullUrl}' did not become ready within ${timeoutMs / 1000} seconds.`);
  return false;
}

/**
 * Executes a flow by making a POST request to its public HTTP endpoint.
 * This function uses a *non-authenticated* axios instance because typically
 * http-in nodes do not require admin API authentication unless configured otherwise
 * via `httpNodeAuth` in Node-RED settings.
 * @param {string} endpointUrl The specific endpoint path (e.g., '/my-flow-path').
 * @param {object} msg The payload to send to the flow.
 * @returns {Promise<any>} The response data from the flow.
 * @throws {Error} If the HTTP request fails or the response status is not OK.
 */
export async function executeEndpointFlow(endpointUrl, msg) {
  logger.debug(`Executing flow at endpoint: ${NODE_RED_URL}${endpointUrl}`);
  try {
    await waitForFlowEndpointReady(endpointUrl);
    const response = await nodeRedApi.post(`${NODE_RED_URL}${endpointUrl}`, msg, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': BASIC_AUTH_HEADER
      },
    });

    logger.debug('Endpoint flow executed successfully.');
    return response.data;
  } catch (error) {
    logger.error('Error executing endpoint flow:', error.message);
    if (axios.isAxiosError(error) && error.response) {
      logger.error(`HTTP error! Status: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    }
    throw error;
  }
}

/**
 * Gets a single flow by its ID from Node-RED Admin API.
 * @param {string} flowId The ID of the flow to retrieve.
 * @returns {Promise<object|null>} The flow object if found, null otherwise.
 */
export async function getFlow(flowId) {
  logger.debug(`Attempting to get flow with ID: ${flowId}`);
  try {
    const response = await nodeRedApi.get(`/flow/${flowId}`, {
      headers: {
        'Authorization': `Bearer ${nodeRedAuthToken}`
      }
    });
    if (response.status === 200) {
      logger.debug(`Flow "${flowId}" retrieved successfully.`);
      return response.data;
    } else if (response.status === 404) {
      logger.warn(`Flow "${flowId}" not found (status 404).`);
      return null;
    } else {
      const errorText = JSON.stringify(response.data);
      logger.error(`Failed to get flow "${flowId}". Status: ${response.status}, Response: ${errorText}`);
      return null;
    }
  } catch (error) {
    logger.error(`Error getting flow ${flowId}:`, error.message);
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        logger.warn(`Flow "${flowId}" not found (Axios 404).`);
        return null;
      }
      logger.error('Node-RED API error:', error.response.status, error.response.data);
    }
    return null;
  }
}

/**
 * Updates an existing flow in Node-RED.
 * @param {string} flowId The ID of the flow to update.
 * @param {object} updatedFlowData The complete updated flow object (id, label, nodes).
 * The 'id' in this object must match 'flowId'.
 * @returns {Promise<boolean>} True if the flow was updated successfully, false otherwise.
 */
export async function updateFlow(flowId, flowPayload) {
  logger.debug(`[Node-RED Utils] Attempting to update flow: ${flowId}`);
  try {
    const response = await nodeRedApi.put(`/flow/${flowId}`, flowPayload, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeRedAuthToken}`
      }
    });

    if (response.status < 300) {
      logger.debug(`[Node-RED Utils] Flow '${flowId}' updated successfully.`);
      return true;
    } else {
      logger.error(`[Node-RED Utils] Failed to update flow '${flowId}'. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error(`[Node-RED Utils] Error updating flow '${flowId}':`, error.message);
    if (axios.isAxiosError(error) && error.response) {
      logger.error('Node-RED API error details:', error.response.status, error.response.data);
    }
    return false;
  }
}

/**
 * Deletes a specific flow by its ID using the Node-RED Admin API.
 * This function uses the authenticated nodeRedApi instance.
 * @param {string} flowId The ID of the flow to delete.
 * @returns {Promise<boolean>} True if the flow was deleted successfully or not found (404), false otherwise.
 */
export async function deleteFlow(flowId) {
  logger.debug(`Attempting to delete Node-RED flow: ${flowId}`);
  try {
    const response = await nodeRedApi.delete(`/flow/${flowId}`, {
      headers: {
        'Authorization': `Bearer ${nodeRedAuthToken}`
      },
    });

    if (response.status === 200 || response.status === 204) {
      logger.debug(`Flow "${flowId}" deleted successfully.`);
      return true;
    } else {
      const errorText = JSON.stringify(response.data);
      logger.error(`Failed to delete flow "${flowId}". Status: ${response.status}, Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        logger.warn(`Flow "${flowId}" not found (already deleted or never existed). Considering as success.`);
        return true;
      }
      logger.error(`Node-RED API error deleting flow ${flowId}: ${error.response.status}, Data: ${JSON.stringify(error.response.data)}`);
    } else {
      logger.error('Error deleting Node-RED flow:', error.message);
    }
    return false;
  }
}

/**
 * Deploys a single flow to Node-RED by sending it in an array to the /flows endpoint.
 * This effectively overwrites all existing flows with just this one flow.
 * @param {object} flowData The complete flow object (id, label, nodes) to deploy.
 * @returns {Promise<boolean>} True if the flow was deployed successfully, false otherwise.
 */
export async function createFlow(flow) {
  const flowId = flow[0].id;
  logger.debug(`Deploying single flow with ID: ${flowId}...`);
  try {
    const response = await nodeRedApi.post('/flows', flow, {
      headers: {
        'Content-Type': 'application/json',
        'Node-RED-Deployment-Type': 'full',
        'Authorization': `Bearer ${nodeRedAuthToken}`
      }
    });

    if (response.status <= 300) {
      logger.debug(`Single flow with ID "${flowId}" deployed successfully.`);
      return true;
    } else {
      logger.error(`Single flow deployment failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error('Error deploying single flow:', error.message);
    if (axios.isAxiosError(error) && error.response) {
      logger.error('Node-RED API error:', error.response.status, error.response.data);
      logger.error('Node-RED API response data:', error.response.data);
    }
    return false;
  }
}

export async function getAllFlows() {
  try {
    const response = await nodeRedApi.get('/flows', {
      headers: {
        'Authorization': `Bearer ${nodeRedAuthToken}`
      }
    });
    if (response.status === 200) {
      return response.data;
    }
    return [];
  } catch (error) {
    logger.error('Error getting all flows:', error.message);
    return [];
  }
}

/**
 * Clears all flows from the Node-RED instance by deploying an empty set of flows.
 * This effectively removes all existing flows.
 * @returns {Promise<boolean>} True if all flows were successfully cleared, false otherwise.
 */
export async function clearAllFlows() {
  logger.debug('[Node-RED Utils] Attempting to clear all flows...');
  try {
    const response = await nodeRedApi.post('/flows', [], {
      headers: {
        'Content-Type': 'application/json',
        'Node-RED-Deployment-Type': 'full',
        'Authorization': `Bearer ${nodeRedAuthToken}`
      },
    });

    if (response.status < 300) {
      logger.debug('[Node-RED Utils] All flows cleared successfully.');
      return true;
    } else {
      logger.error(`[Node-RED Utils] Failed to clear all flows. Status: ${response.status}`);
      return false;
    }
  } catch (error) {
    logger.error('[Node-RED Utils] Error clearing all flows:', error.message);
    if (axios.isAxiosError(error) && error.response) {
      logger.error('Node-RED API error:', error.response.status, error.response.data);
    }
    return false;
  }
}
