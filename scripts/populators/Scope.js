import { models } from '../../src/models/models.js';
import logger from '../../src/config/logger.js';

async function populateScopes() {
  try {
    logger.info('[DATA INITIALIZATION] Starting system scope definitions process');

    // Data for scopes
    const scopes = [
      {
        id: 'b31c3627-d0ea-482a-91a0-05ae6755819a',
        name: 'country',
        description: 'Computation area',
        type: 'string',
        default: '*'
      },
      {
        id: '04280094-5d04-40cb-ad34-e3fa1538cd4b',
        name: 'city',
        description: 'Country City',
        type: 'string',
        default: '*'
      },
      {
        id: '64e01a62-8419-47f8-8699-6f69e769d9d0',
        name: 'declaration',
        description: 'Declaration identifier',
        type: 'string',
        default: '*'
      },
      {
        id: 'd7e3244a-35b9-4eb0-a8de-e531f7b33fdb',
        name: 'location',
        description: 'Specific location of the establishment',
        type: 'string',
        default: '*'
      }
    ];

    for (const scopeData of scopes) {
      const [, created] = await models.Scope.findOrCreate({
        where: { id: scopeData.id },
        defaults: scopeData
      });

      if (created) {
        logger.info(`[SCOPE CREATED] Scope "${scopeData.name}" successfully initialized in the system`);
      } else {
        logger.info(`[SCOPE SKIPPED] Scope "${scopeData.name}" already exists in the system`);
      }
    }

    logger.info('[DATA INITIALIZATION] System scope definitions process completed successfully');
  } catch (error) {
    logger.error('[DATA INITIALIZATION ERROR] Failed to configure system scopes', { error, stack: error.stack });
  }
}

await populateScopes();
