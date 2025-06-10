import axios from 'axios';
import logger from '../../src/config/logger.js';
import 'dotenv/config';

const NODE_RED_URL = process.env.NODE_RED_URL || 'http://localhost:1880';

const NODE_RED_USER = process.env.USER_STATUS;
const NODE_RED_PASSWORD = process.env.PASS_STATUS;

const BASIC_AUTH_HEADER = 'Basic ' + Buffer.from(`${NODE_RED_USER}:${NODE_RED_PASSWORD}`).toString('base64');

let nodeRedAuthToken = '';
let nodeRedApi = null;

/**
 * Checks the status of the Node-RED instance.
 * @returns {Promise<boolean>} True if Node-RED is reachable and responds with a 200 status, false otherwise.
 */
export async function connectNodeRed() {
  try {
    nodeRedAuthToken = await authenticateNodeRed();
    nodeRedApi = axios.create({
      baseURL: NODE_RED_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeRedAuthToken}`,
      },
    });
    const response = await nodeRedApi.get('/');
    return response.status === 200;
  } catch {
    return false;
  }
}

async function authenticateNodeRed() {
  const MAX_RETRIES = 3;
  const RETRY_DELAY_MS = 3000;

  // Create a temporary axios instance for authentication
  const authApi = axios.create({
    baseURL: NODE_RED_URL,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    timeout: 10000
  });

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const tokenResponse = await authApi.post('/auth/token', new URLSearchParams({
        client_id: 'node-red-admin',
        grant_type: 'password',
        scope: '*',
        username: NODE_RED_USER,
        password: NODE_RED_PASSWORD,
      }).toString());

      if (tokenResponse.data && tokenResponse.data.access_token) {
        return tokenResponse.data.access_token;
      }
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 401 || error.response.status === 403) {
          throw new Error(`Node-RED authentication failed: Invalid credentials or insufficient permissions. Status: ${error.response.status}`);
        }
      }
    }
    if (i < MAX_RETRIES - 1) {
      await new Promise(resolve => setTimeout(resolve, RETRY_DELAY_MS));
    }
  }
  throw new Error(`Failed to authenticate with Node-RED after ${MAX_RETRIES} attempts.`);
}

/**
 * Waits for a specific HTTP endpoint of a Node-RED flow to become ready.
 * It polls the endpoint until it gets a response (not necessarily 200 OK),
 * or until a timeout is reached. Useful when a flow's HTTP IN node
 * might take a moment to become active after deployment.
 * @param {string} endpointUrl The specific endpoint path (e.g., '/my-flow-path').
 * @param {number} timeoutMs The maximum time (in milliseconds) to wait.
 * @param {number} intervalMs The delay between polls (in milliseconds).
 * @returns {Promise<boolean>} True if the endpoint responds within the timeout, false otherwise.
 */
async function waitForFlowEndpointReady(endpointUrl, timeoutMs = 90000, intervalMs = 3000) {
  const startTime = Date.now();
  const fullUrl = `/api/v1${endpointUrl}`;
  
  while (Date.now() - startTime < timeoutMs) {
    try {
      await nodeRedApi.post(fullUrl, { timeout: 90000 });
      return true;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        if (error.response.status === 404) {
          // Continue retrying for 404
        } else {
          return true;
        }
      }
    }
    await new Promise(resolve => setTimeout(resolve, intervalMs));
  }

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
  const endpointReady = await waitForFlowEndpointReady(endpointUrl);
  if (!endpointReady) {
    throw new Error(`Flow endpoint ${endpointUrl} did not become ready before execution.`);
  }
    
  // Update nodeRedApi headers for basic auth
  nodeRedApi.defaults.headers.Authorization = BASIC_AUTH_HEADER;
    
  const response = await nodeRedApi.post(endpointUrl, msg, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  return response.data;
}

/**
 * Gets a single flow by its ID from Node-RED Admin API.
 * @param {string} flowId The ID of the flow to retrieve.
 * @returns {Promise<object|null>} The flow object if found, null otherwise.
 */
export async function getFlow(flowId) {
  try {
    const response = await nodeRedApi.get(`/flow/${flowId}`);
    if (response.status === 200) {
      return response.data;
    } else if (response.status === 404) {
      return null;
    } else {
      return null;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return null;
      }
    }
    return null;
  }
}

/**
 * Deletes a specific flow by its ID using the Node-RED Admin API.
 * This function uses the authenticated nodeRedApi instance.
 * @param {string} flowId The ID of the flow to delete.
 * @returns {Promise<boolean>} True if the flow was deleted successfully or not found (404), false otherwise.
 */
export async function deleteFlow(flowId) {
  try {
    const response = await nodeRedApi.delete(`/flow/${flowId}`);

    if (response.status === 200 || response.status === 204) {
      return true;
    } else {
      return false;
    }
  } catch (error) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 404) {
        return true;
      }
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
  try {
    const response = await nodeRedApi.post('/flows', flow, {
      headers: {
        'Content-Type': 'application/json',
        'Node-RED-Deployment-Type': 'full',
      },
    });
    logger.debug(`Flow created: ${JSON.stringify(response.data)}`);
    logger.debug(`Response status: ${response.status}`);
    if (response.status <= 300) {
      return true;
    } else {
      return false;
    }
  } catch {
    return false;
  }
}
