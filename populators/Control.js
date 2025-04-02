import Control from '../src/models/control.model.js';
import { sequelize } from '../src/db/database.js';

async function populateControls() {
  try {
    console.log('Starting control population...');
    // Synchronize the model with the database
    await sequelize.sync({ force: false });

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
      const [, created] = await Control.findOrCreate({
        where: { id: controlData.id },
        defaults: controlData
      });

      if (created) {
        console.log(`Control "${controlData.name}" successfully created.`);
      } else {
        console.log(`Control "${controlData.name}" already exists.`);
      }
    }

    console.log('Control population completed.');
  } catch (error) {
    console.error('Error during control population:', error);
  } finally {
    // Close the database connection
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Connection closed successfully.');
  }
}

// Execute the population function and ensure it terminates
populateControls()
  .then(() => {
    console.log('Control populator finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error in control population:', error);
    process.exit(1);
  });
