import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hydrateControlsWithSecrets } from '../../../src/utils/hydrateControlsWithSecrets.js';
import { Op } from 'sequelize';

describe('hydrateControlsWithSecrets', () => {
  // Mock data to simulate the database
  const mockSecretsById = [{ id: 'uuid-1', name: 'jwt', environment: 'production', valueEncrypted: 'encrypted-jwt' }];
  const mockSecretsByName = [
    { id: 'uuid-2', name: 'ghToken', environment: 'development', valueEncrypted: 'encrypted-github' },
    { id: 'uuid-3', name: 'customSecret', environment: 'staging', valueEncrypted: 'encrypted-custom' }
  ];
  const decryptFn = vi.fn((encrypted) => `decrypted(${encrypted})`);

  // Centralized mock for SecretModel that mimics a real database lookup.
  // It returns mock data based on the query's 'where' clause.
  const SecretModel = {
    findAll: vi.fn(({ where }) => {
      // Simulates searching by ID
      if (where.id && where.id[Op.in]) {
        const ids = where.id[Op.in];
        return Promise.resolve(mockSecretsById.filter(s => ids.includes(s.id)));
      }
      // Simulates searching by name and environment
      if (where[Op.or]) {
        return Promise.resolve(mockSecretsByName.filter(s =>
          where[Op.or].some(cond =>
            cond.name === s.name && cond.environment === s.environment
          )
        ));
      }
      return Promise.resolve([]);
    }),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return controls unchanged if the input is not an array or is empty', async () => {
    expect(await hydrateControlsWithSecrets(null, { SecretModel, decryptFn })).toBe(null);
    expect(await hydrateControlsWithSecrets([], { SecretModel, decryptFn })).toEqual([]);
    expect(await hydrateControlsWithSecrets({}, { SecretModel, decryptFn })).toEqual({});
    expect(SecretModel.findAll).not.toHaveBeenCalled();
  });

  it('should return controls with an empty "resolvedSecrets" object if there are no secretRefs', async () => {
    const controls = [{ id: 1, params: {} }];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0]).toHaveProperty('resolvedSecrets');
    expect(result[0].resolvedSecrets).toEqual({});
    expect(SecretModel.findAll).not.toHaveBeenCalled();
  });

  it('should resolve secrets by id and by name+environment', async () => {
    const controls = [
      {
        id: 1,
        params: {
          secretRefs: [
            { id: 'uuid-1', as: 'jwt' },
            { name: 'ghToken', environment: 'development' }
          ],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });

    expect(result).toHaveLength(1);
    expect(result[0].resolvedSecrets).toEqual({
      jwt: 'decrypted(encrypted-jwt)',
      ghToken: 'decrypted(encrypted-github)',
    });
    expect(decryptFn).toHaveBeenCalledTimes(2);
    expect(decryptFn).toHaveBeenCalledWith('encrypted-jwt');
    expect(decryptFn).toHaveBeenCalledWith('encrypted-github');
    expect(SecretModel.findAll).toHaveBeenCalledTimes(2);
  });

  it('should use the secret name as the key if ref.as is not provided', async () => {
    const controls = [
      {
        id: 11,
        params: {
          secretRefs: [{ id: 'uuid-1' }],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].resolvedSecrets).toEqual({ jwt: 'decrypted(encrypted-jwt)' });
  });

  it('should use the ref name as the key if ref.as is not provided (for name search)', async () => {
    const controls = [
      {
        id: 11,
        params: {
          secretRefs: [{ name: 'ghToken', environment: 'development' }],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].resolvedSecrets).toEqual({ ghToken: 'decrypted(encrypted-github)' });
  });

  it('should set undefined for secrets not found', async () => {
    const controls = [
      {
        id: 2,
        params: {
          secretRefs: [
            { id: 'non-existent-uuid', as: 'missingSecret' },
            { name: 'unknownName', as: 'missingByName' },
          ],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });

    expect(result[0].resolvedSecrets).toEqual({
      missingSecret: undefined,
      missingByName: undefined,
    });
  });

  it('should set undefined for a secret with no encrypted value', async () => {
    // Override the mock to return a secret with a null value
    SecretModel.findAll.mockImplementationOnce(({ where }) => {
      if (where.id && where.id[Op.in]) {
        return Promise.resolve([{ id: 'uuid-3', name: 'emptyValue', environment: 'production', valueEncrypted: null }]);
      }
      return Promise.resolve([]);
    });

    const controls = [
      {
        id: 3,
        params: {
          secretRefs: [{ id: 'uuid-3', as: 'emptyValueSecret' }],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });

    expect(result[0].resolvedSecrets).toEqual({
      emptyValueSecret: undefined,
    });
  });

  it('should set undefined if decryptFn throws an error', async () => {
    const errorDecryptFn = vi.fn(() => { throw new Error('fail decrypt'); });

    const controls = [
      {
        id: 4,
        params: {
          secretRefs: [{ id: 'uuid-1', as: 'jwt' }],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn: errorDecryptFn });

    expect(result[0].resolvedSecrets.jwt).toBeUndefined();
  });

  it('should handle refs with no id or name, setting undefined as the key', async () => {
    const controls = [
      {
        id: 10,
        params: {
          secretRefs: [{}],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].resolvedSecrets).toEqual({ undefined: undefined });
  });

  it('should handle Sequelize instances and convert them to POJOs', async () => {
    const mockSequelizeInstance = {
      get: vi.fn(() => ({ id: 5, params: { secretRefs: [] } })),
    };

    const result = await hydrateControlsWithSecrets([mockSequelizeInstance], { SecretModel, decryptFn });

    expect(mockSequelizeInstance.get).toHaveBeenCalledWith({ plain: true });
    expect(result[0]).toEqual({ id: 5, params: { secretRefs: [] }, resolvedSecrets: {} });
  });

  it('should skip the id query if there are no refs with an id', async () => {
    const controls = [
      {
        id: 12,
        params: {
          secretRefs: [{ name: 'ghToken', environment: 'development' }],
        },
      },
    ];

    await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });

    expect(SecretModel.findAll).toHaveBeenCalledTimes(1);
    expect(SecretModel.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [{ name: 'ghToken', environment: 'development' }],
      },
    });
  });

  it('should skip the name query if there are no refs with a name', async () => {
    const controls = [
      {
        id: 13,
        params: {
          secretRefs: [{ id: 'uuid-1' }],
        },
      },
    ];

    await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });

    expect(SecretModel.findAll).toHaveBeenCalledTimes(1);
    expect(SecretModel.findAll).toHaveBeenCalledWith({
      where: {
        id: { [Op.in]: ['uuid-1'] },
      },
    });
  });

  it('should use the defaultEnvironment if none is specified in the ref', async () => {
    const controls = [
      {
        id: 14,
        params: {
          secretRefs: [{ name: 'customSecret' }],
        },
      },
    ];

    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn, defaultEnvironment: 'staging' });

    expect(SecretModel.findAll).toHaveBeenCalledWith({
      where: {
        [Op.or]: [{ name: 'customSecret', environment: 'staging' }],
      },
    });
    expect(result[0].resolvedSecrets).toEqual({
      customSecret: 'decrypted(encrypted-custom)',
    });
  });

  it('should include the ownerId in queries if provided', async () => {
    const controls = [
      {
        id: 15,
        params: {
          secretRefs: [
            { id: 'uuid-1' },
            { name: 'ghToken' },
          ],
        },
      },
    ];

    await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn, ownerId: 101 });

    expect(SecretModel.findAll).toHaveBeenNthCalledWith(1, {
      where: {
        id: { [Op.in]: ['uuid-1'] },
        ownerId: 101,
      },
    });

    expect(SecretModel.findAll).toHaveBeenNthCalledWith(2, {
      where: {
        [Op.or]: [{ name: 'ghToken', environment: 'production' }],
        ownerId: 101,
      },
    });
  });
  it('should return resolvedSecrets empty when params is missing', async () => {
    const controls = [{ id: 1 }];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].resolvedSecrets).toEqual({});
  });
  it('should fallback to id as key when ref has no as or name', async () => {
    const controls = [
      {
        id: 99,
        params: {
          secretRefs: [
            { id: 'non-existent-uuid' }, // without as name
          ],
        },
      },
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].resolvedSecrets).toEqual({
      'non-existent-uuid': undefined,
    });
  });
});
