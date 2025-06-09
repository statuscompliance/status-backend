import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { testFlow, updatedFlow, endpoint } from '../utils/node-red/sampleNodeRedData.js';
import { createFlow, getFlow, deleteFlow, connectNodeRed, clearAllFlows, getAllFlows, executeEndpointFlow, updateFlow } from '../utils/node-red/nodeRedUtils.js'
import logger from '../../src/config/logger.js';


describe('Node-RED Connection and Basic Flow Deployment Tests', () => {

  beforeAll(async () => {
    logger.debug('\n--- Test Suite: Running Node-RED Connection Tests ---');
    const ready = await connectNodeRed();
    expect(ready).toBe(true);
    logger.debug('Node-RED is confirmed to be connected.');
    await clearAllFlows();
  });

  afterAll(async () => {
    logger.debug('--- Test Suite: Node-RED Connection Tests Finished ---');
    await clearAllFlows();
  });

  describe('Node-Red /flows tests', () => {

    const flow = testFlow.nodes
    const flowLabel = testFlow.label;
    const flowId = testFlow.id

    it('should be able to connect to Node-RED', async () => {
      const isConnected = await connectNodeRed();
      expect(isConnected).toBe(true);
    });

    it('should retrieve an empty array of flows initially (GET /flows)', async () => {
      const allFlows = await getAllFlows();
      expect(allFlows).toEqual([]);
    });

    it('should create a new flow (POST /flows)', async () => {
      const created = await createFlow(flow);
      expect(created).toBe(true);

      const retrievedFlow = await getFlow(flowId);
      expect(retrievedFlow).toBeDefined();
      expect(retrievedFlow.label).toBe(flowLabel);
    });

    it('should retrieve a specific flow by ID (GET /flow/:id)', async () => {
      const retrievedFlow = await getFlow(flowId);
      expect(retrievedFlow).toBeDefined();
      expect(retrievedFlow.id).toBe(flowId);
      expect(retrievedFlow.label).toBe(flowLabel);
    });     

    it('should connect to a flow endpoint, send a message, and receive a response', async () => {
      const msg = { payload: 'Hello Node-Red from Vitest!' };

      const response = await executeEndpointFlow(endpoint, msg);

      expect(response).toBeDefined();
      expect(response).toEqual(expect.objectContaining(msg));
    });

    it('should update an existing flow (PUT /flow/:id)', async () => {
      const updated = await updateFlow(flowId, updatedFlow);
      expect(updated).toBe(true);

      const retrievedFlow = await getFlow(flowId);
      expect(retrievedFlow).toBeDefined();
      expect(retrievedFlow.id).toBe(flowId);
    });   

    it('should delete a flow by ID (DELETE /flow/:id)', async () => {
      const deleted = await deleteFlow(flowId);
      expect(deleted).toBe(true);

      const retrievedFlow = await getFlow(flowId);
      expect(retrievedFlow).toBeNull();
    });

    it('should return null for a non-existent flow (GET /flow/:id)', async () => {
      const nonExistentFlow = await getFlow('non-existent-id');
      expect(nonExistentFlow).toBeNull();
    });

    it('should handle deleting a non-existent flow gracefully (DELETE /flow/:id)', async () => {
      await deleteFlow(flowId);
      const deleted = await deleteFlow(flowId);
      expect(deleted).toBe(true);
    });

  });
});
