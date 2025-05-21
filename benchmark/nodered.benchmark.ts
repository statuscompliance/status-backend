import { describe, bench, beforeEach, afterEach } from 'vitest';
import { connectNodeRed, executeEndpointFlow, updateFlow, deleteFlow } from './utils/nodeRedUtils';
import { simpleFLow, sampleStatusFlow1, sampleStatusFlow2, endpoint } from './flows/sampleFlows';

async function setupNodeRedFlow(endpoint: string, flowId: string, nodes: any) {
  console.log('--- Starting Node Red Benchmarks ---');

  const isConnected = await connectNodeRed();
  if (!isConnected) {
    throw new Error('Failed to connect to Node-RED.');
  }
  console.log('Node-RED connection established.');

  const flowCreated = await updateFlow(flowId, nodes);
  if (!flowCreated) {
    throw new Error(`Failed to create endpoint flow at ${endpoint}.`);
  }
  console.log(`Flow with ID: ${flowId} created successfully at ${endpoint}.`);
}

async function tearDownNodeRedFlow(flowId: string, receivedMessage: any) {
  console.log('--- Ending Benchmarking ---');
  if (flowId) {
    const flowDeleted = await deleteFlow(flowId);
    if (flowDeleted) {
      console.log(`Deleted flow with ID: ${flowId}.`);
    } else {
      console.warn(`Could not delete flow with ID: ${flowId}.`);
    }
  }
  console.log('Closing Node-RED connection...');

  console.log('Node-RED connection closed (simulated logic).');

  if (receivedMessage) {
    console.log('Received message during benchmark:', receivedMessage);
  } else {
    console.log('No message received during benchmark.');
  }
}

describe('Node-Red custom flows Benchmark', () => {
  let receivedMessage: any = null;
  let currentFlow: any = null;

  beforeEach(async () => {
    await setupNodeRedFlow(endpoint, currentFlow.id, currentFlow.nodes);
  });

  afterEach(async () => {
    tearDownNodeRedFlow(currentFlow.id, receivedMessage);
  });


  bench('Sample Default Flow Benchmark', async () => {
    currentFlow = simpleFLow;
    const msg = { payload: 'Sample Message for Benchmarks', timestamp: Date.now() };
    try {
      receivedMessage = await executeEndpointFlow(endpoint, msg);
    } catch (error) {
      console.error('Unexpected error ocurred while executing the flow: ', error);
      throw error;
    }
  });

  bench('Sample Status Flow1 Benchmark', async () => {
    currentFlow = sampleStatusFlow1;
    const payload = [
      {
        message: 'Hello, this is a test message.',
        timestamp: new Date().toISOString()
      },
      {
        message: 'Another test message.',
        timestamp: new Date().toISOString()
      }
    ];

    try {
      receivedMessage = await executeEndpointFlow(endpoint, payload);
    } catch (error) {
      console.error('Unexpected error ocurred while executing the flow: ', error);
      throw error;
    }
  });

  bench('Sample Status Flow2 Benchmark', async () => {
    currentFlow = sampleStatusFlow2;
    const payload = [
      {
        message: 'Hello, this is a test message.',
        timestamp: new Date().toISOString(),
        status: 'success'
      },
      {
        message: 'Another test message.',
        timestamp: new Date().toISOString(),
        status: 'error'
      }
    ];

    try {
      receivedMessage = await executeEndpointFlow(endpoint, payload);
    } catch (error) {
      console.error('Unexpected error ocurred while executing the flow: ', error);
      throw error;
    }
  });

});
