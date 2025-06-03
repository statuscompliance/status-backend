import ScopeSet from '../../src/models/scopeSet.model.js';
import logger from '../../src/config/logger.js';

async function populateScopeSets() {
  try {
    logger.info('[DATA INITIALIZATION] Starting scope set configuration process');

    // Create scope sets
    const scopeSets = [
      {
        _id: '67ae0f1a7d6afdc94d9699da',
        controlId: 1,
        scopes: {
          country: 'Spain',
          city: 'Seville',
          declaration: '*'
        }
      },
      {
        _id: '67af3afe20d90dc32242c11c',
        controlId: 1,
        scopes: {
          country: 'Spain',
          city: 'Cordoba',
          declaration: '*'
        }
      },
      {
        _id: '67c591500d738b20da675dbf',
        controlId: 8,
        scopes: {
          city: 'Seville'
        }
      },
      {
        _id: '67c5922b0d738b20da675dc9',
        controlId: 9,
        scopes: {
          city: 'Seville'
        }
      },
      {
        _id: '67c5928bebb562418fb4ef4d',
        controlId: 10,
        scopes: {
          declaration: '*'
        }
      },
      {
        _id: '67c59301ebb562418fb4ef55',
        controlId: 11,
        scopes: {
          country: 'Spain'
        }
      },
      {
        _id: '67c5934eebb562418fb4ef5e',
        controlId: 12,
        scopes: {
          country: 'Spain'
        }
      },
      {
        _id: '67c59462ebb562418fb4ef64',
        controlId: 13,
        scopes: {
          country: 'Spain',
          city: 'Seville',
          declaration: '*'
        }
      },
      {
        _id: '67c59516bdcf6fbbc7749e68',
        controlId: 14,
        scopes: {
          country: 'asdasd'
        }
      },
      {
        _id: '67c817b99cf55566373537b0',
        controlId: 15,
        scopes: {
          city: 'Seville',
          country: 'Spain'
        }
      },
      {
        _id: '67c96cd674b0994c2b9cd1cd',
        controlId: 17,
        scopes: {
          city: 'Seville',
          country: 'Spain',
          declaration: '*'
        }
      },
      {
        _id: '67c976bb74b0994c2b9cd225',
        controlId: 18,
        scopes: {
          city: 'Malaga',
          country: 'Spain',
          declaration: '*'
        }
      },
      {
        _id: '67c9887843b4f6026b880cd2',
        controlId: 20,
        scopes: {
          country: 'Spain',
          city: 'Seville',
          declaration: '*'
        }
      },
      {
        _id: '67c98c13aa30d42f414dd95b',
        controlId: 19,
        scopes: {
          country: 'Spain',
          city: 'Córdoba',
          declaration: '*'
        }
      },
      {
        _id: '67c992907fc11a47f89e0f60',
        controlId: 21,
        scopes: {
          country: 'Spain',
          city: '*',
          location: '*',
          declaration: '*'
        }
      },
      {
        _id: '67c992997fc11a47f89e0f62',
        controlId: 22,
        scopes: {
          country: 'France',
          city: 'Paris',
          location: '*',
          declaration: '*'
        }
      },
      {
        _id: '67c992a17fc11a47f89e0f64',
        controlId: 23,
        scopes: {
          country: 'Germany',
          city: 'Berlin',
          location: '*',
          declaration: 'DEC-2024-001'
        }
      },
      {
        _id: '67c992a67fc11a47f89e0f66',
        controlId: 24,
        scopes: {
          country: 'Italy',
          city: 'Rome',
          location: 'Via Appia 12',
          declaration: '*'
        }
      }
    ];

    for (const scopeSetData of scopeSets) {
      // Convert string _id to MongoDB ObjectId if necessary
      const existingScopeSet = await ScopeSet.findById(scopeSetData._id);

      if (!existingScopeSet) {
        await ScopeSet.create(scopeSetData);
        logger.info(`[SCOPE SET CREATED] Control ID ${scopeSetData.controlId} scope set successfully initialized`);
      } else {
        logger.info(`[SCOPE SET SKIPPED] Control ID ${scopeSetData.controlId} scope set already exists in the system`);
      }
    }

    logger.info('[DATA INITIALIZATION] Scope set configuration process completed successfully');
  } catch (error) {
    logger.error('[DATA INITIALIZATION ERROR] Failed to configure scope sets', { error, stack: error.stack });
  }
}

await populateScopeSets();
