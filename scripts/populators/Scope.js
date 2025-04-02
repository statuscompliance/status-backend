import { models } from '../../src/models/models.js';

async function populateScopes() {
  try {
    console.log('__________________________________');
    console.log('Starting scope population...');
    console.log('__________________________________');

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
        console.log(`Scope ${scopeData.name} successfully created.`);
      } else {
        console.log(`Scope ${scopeData.name} already exists.`);
      }
    }

    console.log('Scope population completed.');
  } catch (error) {
    console.error('Error during scope population:', error);
  }
}

await populateScopes();
