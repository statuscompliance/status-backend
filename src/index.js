import express from 'express';
import catalogRoutes from './routes/catalog.routes.js';
import controlRoutes from './routes/control.routes.js';
import indexRoutes from './routes/index.routes.js';
import ghAccess from './routes/ghaccess.routes.js';
import userRoutes from './routes/user.routes.js';
import assistantRoutes from './routes/assistant.routes.js';
import threadRoutes from './routes/thread.routes.js';
import configRoutes from './routes/configuration.routes.js';
import grafanaRoutes from './routes/grafana.routes.js';
import computationRoutes from './routes/computation.routes.js';
import scriptRoutes from './routes/script.routes.js';
import pointRoutes from './routes/point.routes.js';
import scopeRoutes from './routes/scope.routes.js';
import cors from 'cors';
import { verifyAuthority } from './middleware/verifyAuth.js';
import { endpointAvailable } from './middleware/endpoint.js';
import cookieParser from 'cookie-parser';
import { models } from './models/models.js';
import { sequelize } from './db/database.js';
import { verifyAdmin } from './middleware/verifyAdmin.js';
import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import logger, { requestLogger, initLogDB } from './config/logger.js';

const isTestEnvironment = !!import.meta.env?.VITEST;
const API_PREFIX = isTestEnvironment ? '' : process.env.API_PREFIX || '';

const swaggerOptions = {
  swaggerDefinition: {
    openapi: '3.0.0',
    info: {
      title: 'STATUS API',
      description: 'API Documentation for the STATUS API',
      version: '1.0.0',
      license: {
        name: 'Apache 2.0',
        url: 'https://www.apache.org/licenses/LICENSE-2.0.html',
      },
    },
    servers: [
      {
        url: `${API_PREFIX}`,
      },
    ],
  },
  apis: ['./src/routes/*.js', './src/models/*.js'],
};
const specs = swaggerJSDoc(swaggerOptions);

// Function to configure the app
const configureApp = () => {
  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: (origin, callback) => {
        callback(null, origin);
      },
      credentials: true,
      allowedHeaders: ['Content-Type', 'Authorization', 'Set-Cookie'],
    })
  );

  // Add middleware for HTTP request logging
  app.use(requestLogger);
  
  app.use(cookieParser());
  app.use(indexRoutes());
  app.use('/docs', swaggerUi.serve, swaggerUi.setup(specs));
  app.get('/api-docs', (req, res) => {
    res.json(specs);
  });
  app.use(endpointAvailable);
  app.use(`${API_PREFIX}`, ghAccess());
  app.use(`${API_PREFIX}/users`, userRoutes());
  app.use(`${API_PREFIX}/scripts`, scriptRoutes());
  app.use(verifyAuthority);
  app.use(`${API_PREFIX}/scopes`, scopeRoutes());
  app.use(`${API_PREFIX}/points`, pointRoutes());
  app.use(`${API_PREFIX}/grafana`, grafanaRoutes());
  app.use(`${API_PREFIX}/controls`, controlRoutes());
  app.use(`${API_PREFIX}/catalogs`, catalogRoutes());
  app.use(`${API_PREFIX}/computations`, computationRoutes());
  app.use(`${API_PREFIX}/assistant`, assistantRoutes());
  app.use(`${API_PREFIX}/thread`, threadRoutes());
  app.use(verifyAdmin);
  app.use(`${API_PREFIX}/config`, configRoutes());

  return app;
};

async function insertEndpointsToConfig() {
  const endpoints = [
    `${API_PREFIX}/config`,
    `${API_PREFIX}/users`,
    `${API_PREFIX}/scripts`,
    `${API_PREFIX}/controls`,
    `${API_PREFIX}/grafana`,
    `${API_PREFIX}/thread`,
    `${API_PREFIX}/catalogs`,
    `${API_PREFIX}/assistant`,
    `${API_PREFIX}/github/auth`,
    `${API_PREFIX}/header`,
    `${API_PREFIX}/computations`,
    `${API_PREFIX}/points`,
    `${API_PREFIX}/scopes`,
    'docs',
    'api-docs',
  ];
  try {
    await sequelize.sync({ alter: true });
    for (const endpoint of endpoints) {
      if (endpoint === `${API_PREFIX}/assistant`) {
        await models.Configuration.findOrCreate({
          where: { endpoint },
          defaults: { endpoint, available: true, limit: 5 },
        });
      } else {
        await models.Configuration.findOrCreate({
          where: { endpoint },
          defaults: { endpoint, available: true },
        });
      }
    }
  } catch (error) {
    console.error('[server] Error inserting endpoints:', error);
  }
}

// Only start the server if we are not in a test environment
if (!isTestEnvironment) {
  const app = configureApp();
  
  // Initialize connection to the log database
  initLogDB().then(() => {
    app.listen(3001, () => {
      logger.info(`Server running on http://localhost:3001${API_PREFIX}`);
      logger.info('Doc on http://localhost:3001/docs');
      logger.info('API Raw Spec on http://localhost:3001/api-docs');
    });
    
    // Insert endpoints to configuration table
    insertEndpointsToConfig();
  }).catch(err => {
    logger.error('Failed to initialize log database', { error: err.message, stack: err.stack });
  });
}

export default configureApp;
