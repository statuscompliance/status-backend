import http from 'http';
import 'dotenv/config'  

const NODE_RED_HOST: string = '127.0.0.1';
const NODE_RED_PORT: number = 1880; // Default Node-RED port
const NODE_RED_USERNAME = 'admin';
const NODE_RED_PASSWORD = 'admin';


function generateAuthHeader(username?: string, password?: string): string | undefined {
  if (username && password) {
    const credentials = `${username}:${password}`;
    const encodedCredentials = Buffer.from(credentials).toString('base64');
    return `Basic ${encodedCredentials}`;
  }
  return undefined;
}

async function checkNodeRedStatus(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.request({
      hostname: NODE_RED_HOST,
      port: NODE_RED_PORT,
      path: '/',
      method: 'GET'
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(1000);
    req.end();
  });
}

export async function connectNodeRed(): Promise<boolean> {

  console.log('Attempting to connect to Node-RED...');

  try {
    return await checkNodeRedStatus();
  } catch (error) {
    console.error('Error connecting to Node-RED:', error);
    return false;
  }
}

export async function executeEndpointFlow(endpointUrl: string, msg: any) {
  
  console.log(`Executing flow at endpoint: http://${NODE_RED_HOST}:${NODE_RED_PORT}${endpointUrl}`);
  
  try {
    const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
    };

    const response = await fetch(
      `http://${NODE_RED_HOST}:${NODE_RED_PORT}${endpointUrl}`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(msg)
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const responseData = await response.json();
    console.log('Endpoint flow executed successfully.');

    return responseData;

  } catch (error) {
    console.error('Error executing endpoint flow:', error);
    throw error;
  }
}

export async function updateFlow(flowId: string, nodes: any): Promise<boolean> {
  console.log(`Attempting to update Node-RED flow with ID: ${flowId}`);

  const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
  const headers = {
    'Content-Type': 'application/json',
    ...(authHeader ? { 'Authorization': authHeader } : {}),
  };

  try {
    const response = await fetch(`http://${NODE_RED_HOST}:${NODE_RED_PORT}/flow/${flowId}`, {
      method: 'PUT',
      headers: headers,
      body: JSON.stringify(nodes),
    });

    if (response.ok) {
      console.log(`Flow with ID "${flowId}" updated successfully.`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Failed to update flow "${flowId}". Status: ${response.status}, Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Error updating Node-RED flow:', error);
    return false;
  }
}

export async function deleteFlow(flowId: string): Promise<boolean> {
  console.log(`Attempting to delete Node-RED flow: ${flowId}`);
  const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
  const headers = {
    ...(authHeader ? { 'Authorization': authHeader } : {}),
  };

  try {
    const response = await fetch(`${NODE_RED_HOST}:${NODE_RED_PORT}/flow/${flowId}`, {
      method: 'DELETE',
      headers: headers,
    });

    if (response.ok) {
      console.log(`Flow "${flowId}" deleted successfully.`);
      return true;

    } else if (response.status === 404) {
      console.warn(`Flow "${flowId}" not found.`);
      return true;
      
    } else {
      const errorText = await response.text();
      console.error(`Failed to delete flow "${flowId}". Status: ${response.status}, Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Error deleting Node-RED flow:', error);
    return false;
  }
}
