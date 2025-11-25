export const sampleLinkers = [
  {
    name: 'production_linker_1',
    defaultMethodName: 'default',
    datasourceIds: ['11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222222'],
    datasourceConfigs: {
      '11111111-1111-1111-1111-111111111111': {
        id: '11111111-1111-1111-1111-111111111111',
        methodConfig: {
          methodName: 'default',
          options: { timeout: 5000 }
        },
        propertyMapping: {
          sourceField: 'targetField'
        }
      },
      '22222222-2222-2222-2222-222222222222': {
        id: '22222222-2222-2222-2222-222222222222',
        methodConfig: {
          methodName: 'custom',
          options: { retries: 3 }
        },
        propertyMapping: {
          input: 'output'
        }
      }
    },
    description: 'Production linker for testing',
    environment: 'production',
    isActive: true,
    createdBy: 'testuser',
    version: 1,
    executionStatus: 'not_executed'
  },
  {
    name: 'dev_linker_1',
    defaultMethodName: 'fetch',
    datasourceIds: ['33333333-3333-3333-3333-333333333333'],
    datasourceConfigs: {
      '33333333-3333-3333-3333-333333333333': {
        id: '33333333-3333-3333-3333-333333333333',
        methodConfig: {
          methodName: 'fetch',
          options: {}
        },
        propertyMapping: {}
      }
    },
    description: 'Development linker for testing',
    environment: 'dev',
    isActive: true,
    createdBy: 'devuser',
    version: 1,
    executionStatus: 'not_executed'
  },
  {
    name: 'staging_linker_1',
    defaultMethodName: 'default',
    datasourceIds: ['44444444-4444-4444-4444-444444444444', '55555555-5555-5555-5555-555555555555'],
    datasourceConfigs: null,
    description: 'Staging linker with minimal config',
    environment: 'staging',
    isActive: false,
    createdBy: 'staginguser',
    version: 2,
    executionStatus: 'pending'
  }
];

export const newLinkerData = {
  name: 'new_test_linker',
  defaultMethodName: 'default',
  datasourceIds: ['aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'],
  datasourceConfigs: {
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa': {
      id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
      methodConfig: {
        methodName: 'default',
        options: {}
      },
      propertyMapping: {}
    }
  },
  description: 'New linker for creation test',
  environment: 'production',
  isActive: true,
  createdBy: 'testuser',
  version: 1,
  executionStatus: 'not_executed'
};

export const invalidLinkerData = {
  name: 'invalid_linker',
  defaultMethodName: 'default',
  datasourceIds: [], // Invalid: empty array
  description: 'Invalid linker with empty datasourceIds',
  environment: 'production',
  isActive: true,
  createdBy: 'testuser'
};

export const updatedLinkerData = {
  description: 'Updated linker description',
  defaultMethodName: 'updated_method',
  isActive: false,
  version: 2,
  executionStatus: 'success'
};
