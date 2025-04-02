import Catalog from '../src/models/catalog.model.js';
import { sequelize } from '../src/db/database.js';

async function populateCatalogs() {
  try {
    console.log('Starting catalog population...');
    // Synchronize the model with the database
    await sequelize.sync({ force: false });

    // Create catalogs
    const catalogs = [
      {
        id: 3,
        name: 'Regulatory Compliance',
        description: 'Collection of documents ensuring compliance with industry regulations.',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        dashboard_id: 'ae08pn1m04lxcd',
        tpaId: 'tpa-ded320a7-5733-4a7e-9e1d-4dc9a09a199c'
      },
      {
        id: 4,
        name: 'Financial Reporting',
        description: 'Documentation ensuring adherence to financial regulations (e.g., SOX, IFRS).',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        dashboard_id: 'ae08pn1m04lxcd',
        tpaId: 'tpa-fbadcd93-1ebb-4077-8408-8da9b7590088'
      },
      {
        id: 5,
        name: 'Information Security',
        description: 'Collection of security policies and procedures (e.g., ISO 27001, NIST).',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        dashboard_id: 'ae08pn1m04lxcd',
        tpaId: 'tpa-97c1e96b-835e-4c56-92e0-59193cde1ba1'
      },
      {
        id: 6,
        name: 'Supply Chain',
        description: 'Documents ensuring ethical and legal supply chain practices.',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        dashboard_id: 'ae08pn1m04lxcd',
        tpaId: 'tpa-d702a2e2-9d13-4e5f-9991-886ec0be7a28'
      },
      {
        id: 7,
        name: 'AML Compliance',
        description: 'Catalog of guidelines and processes for Anti-Money Laundering compliance.',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        dashboard_id: 'ae08pn1m04lxcd',
        tpaId: 'tpa-1f5f936e-ea0d-46bb-ae3f-9f86a35d8ef8'
      },
      {
        id: 8,
        name: 'HIPAA',
        description: 'Documents ensuring compliance with healthcare regulations.',
        startDate: '2024-06-01T00:00:00.000Z',
        endDate: '2024-08-31T23:59:59.000Z',
        dashboard_id: 'ae08pn1m04lxcd',
        tpaId: 'tpa-d883f72c-0836-47e3-84fd-15cad568275e'
      }
    ];

    for (const catalogData of catalogs) {
      const [, created] = await Catalog.findOrCreate({
        where: { id: catalogData.id },
        defaults: catalogData
      });

      if (created) {
        console.log(`Catalog "${catalogData.name}" successfully created.`);
      } else {
        console.log(`Catalog "${catalogData.name}" already exists.`);
      }
    }

    console.log('Catalog population completed.');
  } catch (error) {
    console.error('Error during catalog population:', error);
  } finally {
    // Close the database connection
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Connection closed successfully.');
  }
}

// Execute the population function and ensure it terminates
populateCatalogs()
  .then(() => {
    console.log('Catalog populator finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error in catalog population:', error);
    process.exit(1);
  });
