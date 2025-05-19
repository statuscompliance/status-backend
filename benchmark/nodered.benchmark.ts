import { describe, bench, beforeAll, afterAll } from 'vitest';
import { connectNodeRed, closeNodeRedConnection, executeEndpointFlow, createEndpointFlow, deleteFlow } from './utils/nodeRedUtils';
import { endpoint, flowId, nodes } from './utils/defaultFlow';

describe('Benchmark de Ciclo de Vida Completo de Node-RED', () => {
  let receivedMessage: any = null;

  beforeAll(async () => {
    console.log('--- Inicio del ciclo de vida de la prueba ---');

    const isConnected = await connectNodeRed();
    if (!isConnected) {
      throw new Error('Failed to connect to Node-RED.');
    }
    console.log('Conexión a Node-RED establecida.');

    const flowCreated = await createEndpointFlow(endpoint, flowId, nodes);
    if (!flowCreated) {
      throw new Error(`Failed to create endpoint flow at ${endpoint}.`);
    }
    console.log(`Flujo creado en ${endpoint} con ID ${flowId}.`);
  });

  bench('Ejecutar flujo predeterminado y recibir mensaje', async () => {

    const msg = { payload: 'Mensaje personalizado para la prueba', timestamp: Date.now() };

    try {
      receivedMessage = await executeEndpointFlow(endpoint, msg);
      console.log('Mensaje personalizado enviado y (posiblemente) recibido por el benchmark.');
    } catch (error) {
      console.error('Error al ejecutar el flujo:', error);
      throw error;
    }

  });

  afterAll(async () => {
    console.log('--- Finalizando el ciclo de vida de la prueba ---');
    if (flowId) {
      const flowDeleted = await deleteFlow(flowId);
      if (flowDeleted) {
        console.log(`Flujo con ID ${flowId} eliminado.`);
      } else {
        console.warn(`No se pudo eliminar el flujo con ID ${flowId}.`);
      }
    }
    await closeNodeRedConnection();

    console.log('Conexión a Node-RED cerrada (lógica simulada).');
    
    if (receivedMessage) {
      console.log('Mensaje (posiblemente) recibido durante el benchmark:', receivedMessage);
    } else {
      console.log('No se recibió ningún mensaje específico durante el benchmark (depende del flujo de Node-RED).');
    }
  });
  
});