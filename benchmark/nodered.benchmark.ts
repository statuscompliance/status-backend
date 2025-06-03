import { describe, bench, beforeEach, beforeAll, expect } from 'vitest';
import { deleteFlow, executeEndpointFlow, connectNodeRed, createFlow } from './utils/nodeRedUtils.js';
import { simpleFLow, sampleStatusFlow1, sampleStatusFlow2, endpoint } from './flows/sampleFlows.js';
import logger from '../src/config/logger.js';


describe('Node-Red custom flows Benchmark', () => {
  
  beforeAll(async () => {
    logger.info('Starting Node-RED custom flows benchmark...');
    const ready = await connectNodeRed();
    expect(ready).toBe(true);
    logger.info('Node-RED is ready for benchmarks.');
  });

  beforeEach(async () => {
    await connectNodeRed();
  });

  bench('Simple Default Flow Benchmark', async () => {

    try {
      logger.debug(`[Benchmark] Deploying ${simpleFLow.id}`);
      const deployed = await createFlow(simpleFLow.flow);
      if (!deployed) {
        throw new Error(`Failed to deploy flow for benchmark: ${simpleFLow.id}`);
      }

      const msg = { payload: 'Sample Message for Benchmarks', timestamp: Date.now() };

      await executeEndpointFlow(endpoint, msg);

    } catch (error) {
      logger.error('Unexpected error occurred while executing the flow: ', error);
      throw error;
    } finally {
      logger.debug(`[Benchmark] Deleting ${simpleFLow.id}`);
      const deleted = await deleteFlow(simpleFLow.id);
      if (!deleted) {
        logger.warn(`Failed to delete flow after benchmark: ${simpleFLow.id}. Manual cleanup might be needed.`);
      }
    }
  });

  bench('Sample Status Flow1 Benchmark', async () => {

    try {
      logger.debug(`[Benchmark] Deploying ${sampleStatusFlow1.id}`);
      const deployed = await createFlow(sampleStatusFlow1.flow);
      if (!deployed) {
        throw new Error(`Failed to deploy flow for benchmark: ${sampleStatusFlow1.id}`);
      }

      const payload = [
        { message: 'Hello, this is a test message.', timestamp: new Date().toISOString() },
        { message: 'Another test message.', timestamp: new Date().toISOString() }
      ];

      await executeEndpointFlow(endpoint, payload);

    } catch (error) {
      logger.error('Unexpected error occurred while executing the flow: ', error);
      throw error;
    } finally {
      logger.debug(`[Benchmark] Deleting ${sampleStatusFlow1.id}`);
      const deleted = await deleteFlow(sampleStatusFlow1.id);
      if (!deleted) {
        logger.warn(`Failed to delete flow after benchmark: ${sampleStatusFlow1.id}. Manual cleanup might be needed.`);
      }
    }
  });

  bench('Sample Status Flow2 Benchmark', async () => {

    try {
      logger.debug(`[Benchmark] Deploying ${sampleStatusFlow2.id}`);
      const deployed = await createFlow(sampleStatusFlow2.flow);
      if (!deployed) {
        throw new Error(`Failed to deploy flow for benchmark: ${sampleStatusFlow2.id}`);
      }

      const payload = [
        { message: 'Hello, this is a test message.', timestamp: new Date().toISOString(), status: 'success' },
        { message: 'Another test message.', timestamp: new Date().toISOString(), status: 'error' }
      ];

      await executeEndpointFlow(endpoint, payload);

    } catch (error) {
      logger.error('Unexpected error occurred while executing the flow: ', error);
      throw error;
    } finally {
      logger.debug(`[Benchmark] Deleting ${sampleStatusFlow2.id}`);
      const deleted = await deleteFlow(sampleStatusFlow2.id);
      if (!deleted) {
        logger.warn(`Failed to delete flow after benchmark: ${sampleStatusFlow2.id}. Manual cleanup might be needed.`);
      }
    }
  });

});
