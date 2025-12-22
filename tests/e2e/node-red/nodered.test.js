import { describe, beforeAll, afterAll, expect, it } from 'vitest';
import { testFlow, updatedFlow, endpoint } from '../utils/sampleNodeRedData.js';
import { createFlow, getFlow, deleteFlow, connectNodeRed, clearAllFlows, getAllFlows, executeEndpointFlow, updateFlow } from '../utils/nodeRedUtils.js'
import logger from '../../../src/config/logger.js';


describe('Node-RED Connection and Basic Flow Deployment Tests', () => {

  beforeAll(async () => {
    logger.debug('\n--- Test Suite: Running Node-RED Connection Tests ---');
    const response = await connectNodeRed();
    expect(response.status).toBe(200);
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
      const response = await connectNodeRed();
      expect(response.status).toBe(200);
      expect(response.statusText).toBe('OK')
    });

    it('should retrieve an empty array of flows initially (GET /flows)', async () => {
      const response = await getAllFlows();
      expect(response.data).toEqual([]);
    });

    it('should create a new flow (POST /flows)', async () => {
      const createResponse = await createFlow(flow);
      expect(createResponse.status).toBe(204);
      expect(createResponse.statusText).toBe('No Content')

      const retrievedFlowResponse = await getFlow(flowId);
      expect(retrievedFlowResponse.data).toBeDefined();
      expect(retrievedFlowResponse.data.label).toBe(flowLabel);
    });

    it('should retrieve a specific flow by ID (GET /flow/:id)', async () => {
      const retrievedFlowResponse = await getFlow(flowId);
      expect(retrievedFlowResponse.data).toBeDefined();
      expect(retrievedFlowResponse.data.id).toBe(flowId);
      expect(retrievedFlowResponse.data.label).toBe(flowLabel);
    });     

    it('should connect to a flow endpoint, send a message, and receive a response', async () => {
      const msg = { payload: 'Hello Node-Red from Vitest!' };

      const response = await executeEndpointFlow(endpoint, msg);

      expect(response.data).toBeDefined();
      expect(response.data).toEqual(expect.objectContaining(msg));
    });

    it('should update an existing flow (PUT /flow/:id)', async () => {
      const updatedResponse = await updateFlow(flowId, updatedFlow);
      expect(updatedResponse.status).toBe(200);
      expect(updatedResponse.statusText).toBe('OK');

      const retrievedFlowResponse = await getFlow(flowId);
      expect(retrievedFlowResponse.data).toBeDefined();
      expect(retrievedFlowResponse.data.id).toBe(flowId);
    });   

    it('should delete a flow by ID (DELETE /flow/:id)', async () => {
      const deletedResponse = await deleteFlow(flowId);
      expect(deletedResponse.status).toBe(204);
      expect(deletedResponse.statusText).toBe('No Content')

      const retrievedFlow = await getFlow(flowId);
      expect(retrievedFlow.status).toBe(404);
    });

    it('should return null for a non-existent flow (GET /flow/:id)', async () => {
      const nonExistentFlowResponse = await getFlow('non-existent-id');
      expect(nonExistentFlowResponse.status).toBe(404);
    });

    it('should handle deleting a non-existent flow gracefully (DELETE /flow/:id)', async () => {
      const deleteResponse = await deleteFlow(flowId);
      expect(deleteResponse.status).toBe(404);
    });

  });
});
