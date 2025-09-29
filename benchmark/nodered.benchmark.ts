import { describe, bench, beforeAll, expect } from 'vitest';
import { deleteFlow, executeEndpointFlow, createNodeRedApi, createFlow } from './utils/nodeRedUtils.js';
import { simpleFLow, sampleStatusFlow1, sampleStatusFlow2, endpoint } from './flows/sampleFlows.js';
import logger from '../src/config/logger.js';

describe('Node-Red custom flows Benchmark', async () => {

  logger.info('Starting Node-RED custom flows benchmark...');

  bench('Simple Default Flow Benchmark', async () => {
    const nodeRedApi = await createNodeRedApi();
    console.log("Defined Node Red Api:", nodeRedApi);
    try {
      logger.debug(`[Benchmark] Deploying ${simpleFLow.flow[0].id}`);
      const createResponse = await createFlow(simpleFLow.flow, nodeRedApi);
      console.log('Debug Creation Response: ', createResponse);


      const msg = { payload: 'Sample Message for Benchmarks', timestamp: Date.now() };

      await executeEndpointFlow(endpoint, msg);

    } catch (error) {
      logger.error('Unexpected error occurred while executing the flow: ', error);
      throw error;
    } finally {
      logger.debug(`[Benchmark] Deleting ${simpleFLow.flow[0].id}`);
      const deleted = await deleteFlow(nodeRedApi, simpleFLow.flow[0].id);
      if (!deleted) {
        logger.warn(`Failed to delete flow after benchmark: ${simpleFLow.flow[0].id}. Manual cleanup might be needed.`);
      }
    }
  });

  bench('Sample Status Flow1 Benchmark', async () => {    
    const nodeRedApi = await createNodeRedApi();
    try {

      const nodeRedApi = await createNodeRedApi();
      logger.debug(`[Benchmark] Deploying ${sampleStatusFlow1.flow[0].id}`);
      const deployed = await createFlow(nodeRedApi, sampleStatusFlow1.flow);
      if (!deployed) {
        throw new Error(`Failed to deploy flow for benchmark: ${sampleStatusFlow1.flow[0].id}`);
      }

      const payload = [
        { message: 'Hello, this is a test message.', timestamp: new Date().toISOString() },
        { message: 'Another test message.', timestamp: new Date().toISOString() }
      ];

      await executeEndpointFlow( endpoint, payload);

    } catch (error) {
      logger.error('Unexpected error occurred while executing the flow: ', error);
      throw error;
    } finally {
      logger.debug(`[Benchmark] Deleting ${sampleStatusFlow1.flow[0].id}`);
      const deleted = await deleteFlow(nodeRedApi, sampleStatusFlow1.flow[0].id);
      if (!deleted) {
        logger.warn(`Failed to delete flow after benchmark: ${sampleStatusFlow1.flow[0].id}. Manual cleanup might be needed.`);
      }
    }
  });

  bench('Sample Status Flow2 Benchmark', async () => {    
    const nodeRedApi = await createNodeRedApi();
    try {
      const nodeRedApi = await createNodeRedApi();
      logger.debug(`[Benchmark] Deploying ${sampleStatusFlow2.flow[0].id}`);
      const createResponse = await createFlow(nodeRedApi, sampleStatusFlow2.flow);
      logger.debug('Debug Error: ', JSON.stringify(createResponse, null, 2));

      const payload = [
        { message: 'Hello, this is a test message.', timestamp: new Date().toISOString(), status: 'success' },
        { message: 'Another test message.', timestamp: new Date().toISOString(), status: 'error' }
      ];

      await executeEndpointFlow(endpoint, payload);

    } catch (error) {
      logger.error('Unexpected error occurred while executing the flow: ', error);
      throw error;
    } finally {
      logger.debug(`[Benchmark] Deleting ${sampleStatusFlow2.flow[0].id}`);
      const deleted = await deleteFlow(nodeRedApi, sampleStatusFlow2.flow[0].id);
      if (!deleted) {
        logger.warn(`Failed to delete flow after benchmark: ${sampleStatusFlow2.flow[0].id}. Manual cleanup might be needed.`);
      }
    }
  });
});