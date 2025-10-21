import { DatasourceCatalog, Datasources } from '@statuscompliance/databinder';
import logger from './logger.js';

const { RestApiDatasource, MicrosoftGraphDatasource } = Datasources;

let catalog = null;

export function getDatabinderCatalog() {
  if (!catalog) {
    catalog = new DatasourceCatalog();
    initializeDatasourceDefinitions();
  }
  return catalog;
}

function initializeDatasourceDefinitions() {
  try {
    // Register built-in datasource definitions
    catalog.registerDatasource(RestApiDatasource);
    catalog.registerDatasource(MicrosoftGraphDatasource);
    
    // Register custom datasource definitions if needed
    registerCustomDatasources();

    const definitions = catalog.listDatasourceDefinitions();
    logger.info(`Databinder catalog initialized successfully with ${definitions.length} datasource definitions:`, 
      definitions.map(def => def.id).join(', '));
  } catch (error) {
    logger.error('Error initializing databinder catalog:', error);
  }
}

function registerCustomDatasources() {
  // Register any custom datasources here if needed
  try {
    // Custom datasources can be registered here
    // Example: catalog.registerDatasource(customDatasource);
  } catch (error) {
    logger.warn('Failed to register custom datasources:', error.message);
  }
}

// Initialize catalog when module is imported
getDatabinderCatalog();
