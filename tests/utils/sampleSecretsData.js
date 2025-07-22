export function createSecretExample(overrides = {}) {
  return {
    id: 1,
    name: 'Test Secret',
    type: 'database',
    environment: 'development',
    value: 'secret-value-123',
    valueEncrypted: 'encrypted-secret-value',
    createdBy: 'testuser',
    version: 1,
    rotatedAt: new Date(),
    ownerId: 123,
    createdAt: new Date(),
    updatedAt: new Date(),
    toJSON: function() {
      return { ...this };
    },
    update: function(data) {
      Object.assign(this, data);
      return Promise.resolve(this);
    },
    destroy: function() {
      return Promise.resolve();
    },
    ...overrides,
  };
}

export const sampleSecrets = [
  {
    id: 1,
    name: 'Database Password',
    type: 'database',
    environment: 'production',
    createdBy: 'admin',
    version: 1,
    rotatedAt: new Date('2025-01-01'),
    ownerId: 123,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 2,
    name: 'API Key',
    type: 'api',
    environment: 'development',
    createdBy: 'developer',
    version: 2,
    rotatedAt: new Date('2025-01-15'),
    ownerId: 123,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
