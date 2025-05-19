import http from 'http';
import * as dotenv from 'dotenv';
dotenv.config();

const NODE_RED_PORT: number = 1880;
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
      hostname: 'localhost',
      port: NODE_RED_PORT,
      path: '/',
      method: 'GET'
    }, (res) => {
      resolve(true);
    });

    req.on('error', () => {
      resolve(false);
    });

    req.setTimeout(1000); // Adjust timeout as needed
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
  
  console.log(`Executing flow at endpoint: http://localhost:${NODE_RED_PORT}${endpointUrl}`);
  
  try {
    const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
    const headers: { [key: string]: string } = {
      'Content-Type': 'application/json',
      ...(authHeader ? { 'Authorization': authHeader } : {}),
    };

    const response = await fetch(
      `http://localhost:${NODE_RED_PORT}${endpointUrl}`, {
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

export async function closeNodeRedConnection(): Promise<void> {
  
  console.log('Closing Node-RED connection...');
}

export async function createEndpointFlow(endpointUrl: string, flowId: string, nodes: Object): Promise<boolean> {
  console.log(`Creating Node-RED flow with endpoint: ${endpointUrl} (ID: ${flowId})`);

  const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
  const headers = {
    'Content-Type': 'application/json',
    ...(authHeader ? { 'Authorization': authHeader } : {}),
  };

  try {
    const response = await fetch(`http://localhost:${NODE_RED_PORT}/flow`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(nodes),
    });

    if (response.ok) {
      console.log(`Endpoint flow "${flowId}" created successfully at ${endpointUrl}.`);
      return true;
    } else {
      const errorText = await response.text();
      console.error(`Failed to create endpoint flow "${flowId}". Status: ${response.status}, Response: ${errorText}`);
      return false;
    }
  } catch (error) {
    console.error('Error creating Node-RED endpoint flow:', error);
    return false;
  }
}

export async function createFlow(nodes: any): Promise<string | null> {
  console.log('Attempting to create Node-RED flow with configuration:', nodes);

  const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
  const headers = {
    'Content-Type': 'application/json',
    ...(authHeader ? { 'Authorization': authHeader } : {}),
  };

  try {
    const response = await fetch(`http://localhost:${NODE_RED_PORT}/flows`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(nodes),
    });

    if (response.ok) {
      const responseData = await response.json();
      const flowId = responseData.flows[0].id; // Assuming the first flow in the array is the one we created
      console.log(`Flow created successfully with ID: ${flowId}`);
      return flowId;
    } else {
      // Handle error response
      const errorText = await response.text();
      console.error(`Failed to create flow. Status: ${response.status}, Response: ${errorText}`);
      return null;
    }

  } catch (error) {
    console.error('Error creating Node-RED flow:', error);
    return null;
  }
}

export async function deleteFlow(flowId: string): Promise<boolean> {
  console.log(`Attempting to delete Node-RED flow: ${flowId}`);
  const authHeader = generateAuthHeader(NODE_RED_USERNAME, NODE_RED_PASSWORD);
  const headers = {
    ...(authHeader ? { 'Authorization': authHeader } : {}),
  };

  try {
    const response = await fetch(`http://localhost:${NODE_RED_PORT}/flow/${flowId}`, {
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