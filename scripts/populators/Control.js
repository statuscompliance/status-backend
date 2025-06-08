import { models } from '../../src/models/models.js';
import logger from '../../src/config/logger.js';

async function populateControls() {
  try {
    logger.info('[DATA INITIALIZATION] Starting control definitions process');

    // Create controls
    const controls = [
      {
        id: 20,
        name: 'Data Privacy',
        description: 'Ensures data privacy documents have more than 10 sections.',
        period: 'MONTHLY',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.000Z',
        mashupId: 'abc123',
        params: {
          endpoint: '/bpi',
          threshold: 10
        },
        catalogId: 3
      },
      {
        id: 21,
        name: 'Balance Sheet Accuracy Check',
        description: 'Validates that balance sheets are complete and meet reporting standards.',
        period: 'WEEKLY',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.000Z',
        mashupId: 'abc124',
        params: {
          endpoint: '/bpi',
          threshold: 1
        },
        catalogId: 4
      },
      {
        id: 22,
        name: 'Income Statement',
        description: 'Ensures that income statements are reviewed and contain all required sections.',
        period: 'MONTHLY',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.000Z',
        mashupId: 'abc125',
        params: {
          endpoint: '/bpi',
          threshold: 10
        },
        catalogId: 4
      },
      {
        id: 23,
        name: 'Audit Trail Completeness',
        description: 'Verifies that all financial transactions are documented for audit compliance.',
        period: 'WEEKLY',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.000Z',
        mashupId: 'abc126',
        params: {
          endpoint: '/bpi',
          threshold: 1
        },
        catalogId: 4
      },
      {
        id: 24,
        name: 'Financial Disclosure Check',
        description: 'Ensures all financial disclosures contain accurate and complete information.',
        period: 'MONTHLY',
        startDate: '2023-01-01T00:00:00.000Z',
        endDate: '2023-12-31T23:59:59.000Z',
        mashupId: 'abc127',
        params: {
          endpoint: '/bpi',
          threshold: 5
        },
        catalogId: 4
      }
    ];

    for (const controlData of controls) {
      const [, created] = await models.Control.findOrCreate({
        where: { id: controlData.id },
        defaults: controlData
      });

      if (created) {
        logger.info(`[CONTROL CREATED] Control "${controlData.name}" successfully initialized in the system`);
      } else {
        logger.info(`[CONTROL SKIPPED] Control "${controlData.name}" already exists in the system`);
      }
    }

    logger.info('[DATA INITIALIZATION] Control definitions process completed successfully');
  } catch (error) {
    logger.error('[DATA INITIALIZATION ERROR] Failed to configure system controls', { error, stack: error.stack });
  }
}

await populateControls();
