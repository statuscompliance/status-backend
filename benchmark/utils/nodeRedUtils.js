import axios from 'axios';
import logger from '../../src/config/logger.js';
import 'dotenv/config';
import { getNodeRedToken } from '../../src/utils/nodeRedToken.js';

const NODE_RED_URL = process.env.NODE_RED_URL || 'http://localhost:1880';

const NODE_RED_USER = process.env.USER_STATUS;
const NODE_RED_PASSWORD = process.env.PASS_STATUS;
const basicAuth = Buffer.from(`${NODE_RED_USER}:${NODE_RED_PASSWORD}`).toString('base64');
const BASIC_AUTH_HEADER = `Basic ${basicAuth}`;


/**
 * Checks the status of the Node-RED instance.
 * @returns {Promise<boolean>} True if Node-RED is reachable and responds with a 200 status, false otherwise.
 */
export async function createNodeRedApi() {
  try {
    const nodeRedAuthToken = await getNodeRedToken(NODE_RED_USER,NODE_RED_PASSWORD);
    const nodeRedApi = axios.create({
      baseURL: NODE_RED_URL,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${nodeRedAuthToken}`,
      },
    });
    return nodeRedApi;

  } catch(error) {
    return error;
  }
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
  
  const nodeRedApi = axios.create({
    baseURL: NODE_RED_URL,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': BASIC_AUTH_HEADER,
    },
  });
    
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
export async function getFlow(nodeRedApi, flowId) {
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
export async function deleteFlow(nodeRedApi, flowId) {
  try {
    const response = await nodeRedApi.delete(`/flow/${flowId}`);
    return response;

  } catch (error) {
    return error;
  }
}

/**
 * Deploys a single flow to Node-RED by sending it in an array to the /flows endpoint.
 * This effectively overwrites all existing flows with just this one flow.
 * @param {object} flowData The complete flow object (id, label, nodes) to deploy.
 * @returns {Promise<boolean>} True if the flow was deployed successfully, false otherwise.
 */
export async function createFlow(nodeRedApi, flow) {
  try {
    const response = await nodeRedApi.post('/flows', flow, {
      headers: {
        'Content-Type': 'application/json',
        'Node-RED-Deployment-Type': 'full',
      },
    });
    logger.info('Response Status: ', response.status);
    return response;
  } catch (error) {
    return error;
  }
}
