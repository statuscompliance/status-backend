import logger from '../../../src/config/logger'

const { exec: execCallback } = require('child_process');
const { promisify } = require('util');
const axios = require('axios');

const exec = promisify(execCallback);

//Node red container configuration
const NODE_RED_CONTAINER_NAME = 'node-red-testing'; 
const composeFilePath = 'tests/setup/node-red/docker-compose-node-red.yml'; 
const NODE_RED_SERVICE_NAME = 'node-red-test'; 
const NODE_RED_URL = 'http://localhost:1880';

export async function setupNodeRed() {
  logger.debug(`Setting up Node-RED container (${NODE_RED_CONTAINER_NAME}) ---`);
  try {
    await deployNodeRedContainer();
    logger.debug('Node-RED setup completed successfully.');
  } catch (error) {
    logger.error(`Error during Node-RED setup: ${error.message}`);
    throw error; // Re-throw to ensure test suite fails if setup fails
  }
}

export async function teardownNodeRed() {
  logger.debug(`Tearing down Node-RED container (${NODE_RED_CONTAINER_NAME}) ---`);
  try {
    await stopAndRemoveNodeRedContainer();
    logger.debug('Node-RED teardown completed successfully.');
  } catch (error) {
    logger.error(`Error during Node-RED teardown: ${error.message}`);
    // No re-throwing here to allow other teardowns to proceed
  }
}

/**
 * Checks if the Node-RED Docker container is currently running.
 * @returns {Promise<boolean>} True if the container is running, false otherwise.
 */
async function isContainerRunning() {
  logger.debug(`Checking if container '${NODE_RED_CONTAINER_NAME}' is running...`);
  try {
    const { stdout } = await exec(`docker ps -f name=^/${NODE_RED_CONTAINER_NAME}$ -q`);
    const isRunning = stdout.trim().length > 0;
    logger.debug(`Container '${NODE_RED_CONTAINER_NAME}' running status: ${isRunning}`);
    return isRunning;
  } catch (error) {
    logger.warn(`Could not determine if container ${NODE_RED_CONTAINER_NAME} is running: ${error.message}`);
    return false;
  }
}

/**
 * Waits for the Node-RED instance to be ready and responsive at its URL.
 * @param {number} timeout The maximum time (in milliseconds) to wait for Node-RED to respond.
 * @returns {Promise<boolean>} True if Node-RED becomes ready within the timeout, false otherwise.
 * @throws {Error} If Node-RED does not become ready within the specified timeout.
 */
async function waitForNodeRedReady(timeout) {
  const startTime = Date.now();
  logger.debug(`Waiting for Node-RED at ${NODE_RED_URL} to be ready...`);
  while (Date.now() - startTime < timeout) {
    try {
      const response = await axios.get(NODE_RED_URL, { timeout: 2000 }); // Short timeout for health check
      if (response.status === 200) {
        logger.debug('Node-RED is ready!');
        return true;
      }
    } catch (e) {
      logger.debug(`Node-RED not ready yet: ${e.message}`);
    }
    await new Promise(resolve => setTimeout(resolve, 2000)); // Wait 2 seconds before retrying
  }
  throw new Error(`Node-RED did not respond at ${NODE_RED_URL} within ${timeout / 1000} seconds.`);
}

/**
 * Deploys the Node-RED Docker container and waits for it to be ready.
 * If the container is already running, it will just wait for it to be ready.
 * @returns {Promise<void>} A promise that resolves when Node-RED is deployed and ready.
 * @throws {Error} If the container fails to start or Node-RED does not become ready.
 */
async function deployNodeRedContainer() {
  logger.debug(`\n--- Docker Control: Deploying Node-RED container (${NODE_RED_CONTAINER_NAME}) ---`);
  try {
    const containerIsRunning = await isContainerRunning();
    if (containerIsRunning) {
      logger.debug(`${NODE_RED_CONTAINER_NAME} is already running. Ensuring it's healthy.`);
    } else {
      logger.debug(`${NODE_RED_CONTAINER_NAME} is not running. Launching container via docker compose.`);
      const composeUpCommand = `docker compose -f ${composeFilePath} up -d ${NODE_RED_SERVICE_NAME}`;
      logger.debug(`Running command: ${composeUpCommand}`);
      await exec(composeUpCommand);
    }
    
    await waitForNodeRedReady(120000); // 2 minutes timeout for Node-RED startup
    logger.debug('Node-RED container successfully deployed and ready.');
  } catch (error) {
    logger.error(`Failed to deploy Node-RED container: ${error.message}`);
    throw error;
  }
}

/**
 * Stops and removes the Node-RED Docker container.
 * Also removes associated volumes to ensure a clean state for next runs.
 * @returns {Promise<void>} A promise that resolves when the container is stopped and removed.
 */
async function stopAndRemoveNodeRedContainer() {
  logger.debug(`\n--- Docker Control: Stopping and removing Node-RED container (${NODE_RED_CONTAINER_NAME}) ---`);
  try {
    const composeDownCommand = `docker compose -f ${composeFilePath} down -v --remove-orphans`;
    logger.debug(`Running command: ${composeDownCommand}`);
    await exec(composeDownCommand);
    logger.debug('Node-RED container successfully stopped and removed.');
  } catch (error) {
    logger.error(`Failed to stop Node-RED container: ${error.message}`);
    // No lanzamos el error para no bloquear el teardown si el contenedor no existe, etc.
  }
}
