import { describe, it, expect, vi, beforeEach } from 'vitest';
import { hydrateControlsWithSecrets } from '../../../src/utils/hydrateControlsWithSecrets.js';
import { Op } from 'sequelize';

describe('hydrateControlsWithSecrets (refactor)', () => {
  const mockSecretsById = [
    { id: 'uuid-1', name: 'jwt', environment: 'production', valueEncrypted: 'encrypted-jwt' }
  ];
  const mockSecretsByName = [
    { id: 'uuid-2', name: 'ghToken', environment: 'development', valueEncrypted: 'encrypted-github' },
    { id: 'uuid-3', name: 'customSecret', environment: 'staging', valueEncrypted: 'encrypted-custom' }
  ];
  const decryptFn = vi.fn((encrypted) => `decrypted(${encrypted})`);

  const SecretModel = {
    findAll: vi.fn(({ where }) => {
      if (where.id && where.id[Op.in]) {
        const ids = where.id[Op.in];
        return Promise.resolve(mockSecretsById.filter(s => ids.includes(s.id)));
      }
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

  it('returns controls unchanged if not an array or empty', async () => {
    expect(await hydrateControlsWithSecrets(null, { SecretModel, decryptFn })).toBe(null);
    expect(await hydrateControlsWithSecrets([], { SecretModel, decryptFn })).toEqual([]);
    expect(await hydrateControlsWithSecrets({}, { SecretModel, decryptFn })).toEqual({});
    expect(SecretModel.findAll).not.toHaveBeenCalled();
  });

  it('returns controls with params cleaned if no secretRefs', async () => {
    const controls = [{ id: 1, params: {} }];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].params).toEqual({});
    expect(result[0]).not.toHaveProperty('secretErrors');
  });

  it('resolves secrets by id and name+env', async () => {
    const controls = [
      {
        id: 1,
        params: {
          secretRefs: [
            { id: 'uuid-1', as: 'jwt' },
            { name: 'ghToken', environment: 'development' },
          ],
        },
      },
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].params).toEqual({
      jwt: 'decrypted(encrypted-jwt)',
      ghToken: 'decrypted(encrypted-github)',
    });
    expect(decryptFn).toHaveBeenCalledWith('encrypted-jwt');
    expect(decryptFn).toHaveBeenCalledWith('encrypted-github');
    expect(result[0]).not.toHaveProperty('secretErrors');
  });

  it('uses id as key if no as or name given', async () => {
    const controls = [
      { id: 2, params: { secretRefs: [{ id: 'uuid-1' }] } }
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].params).toEqual({ 'uuid-1': 'decrypted(encrypted-jwt)' });
  });

  it('sets undefined + error if secret not found', async () => {
    const controls = [
      { id: 3, params: { secretRefs: [{ id: 'non-existent-uuid', as: 'missingSecret' }] } }
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].params).toEqual({ missingSecret: undefined });
    expect(result[0].secretErrors[0].error).toBe('NOT_FOUND');
  });

  it('sets undefined + error if secret has no encrypted value', async () => {
    SecretModel.findAll.mockImplementationOnce(({ where }) => {
      if (where.id && where.id[Op.in]) {
        return Promise.resolve([{ id: 'uuid-x', name: 'emptyValue', environment: 'production', valueEncrypted: null }]);
      }
      return Promise.resolve([]);
    });
    const controls = [
      { id: 4, params: { secretRefs: [{ id: 'uuid-x', as: 'emptyValueSecret' }] } }
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].params).toEqual({ emptyValueSecret: undefined });
    expect(result[0].secretErrors[0].error).toBe('NOT_FOUND');
  });

  it('sets undefined + error if decryptFn throws', async () => {
    const badDecrypt = vi.fn(() => { throw new Error('fail'); });
    const controls = [
      { id: 5, params: { secretRefs: [{ id: 'uuid-1', as: 'jwt' }] } }
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn: badDecrypt });
    expect(result[0].params.jwt).toBeUndefined();
    expect(result[0].secretErrors[0].error).toBe('DECRYPT_ERROR');
  });

  it('handles Sequelize instances', async () => {
    const mockSequelize = { get: vi.fn(() => ({ id: 6, params: { secretRefs: [] } })) };
    const result = await hydrateControlsWithSecrets([mockSequelize], { SecretModel, decryptFn });
    expect(mockSequelize.get).toHaveBeenCalledWith({ plain: true });
    expect(result[0]).toEqual({ id: 6, params: {} });
  });

  it('uses defaultEnvironment if missing in ref', async () => {
    const controls = [
      { id: 7, params: { secretRefs: [{ name: 'customSecret' }] } }
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn, defaultEnvironment: 'staging' });
    expect(SecretModel.findAll).toHaveBeenCalledWith({
      where: { [Op.or]: [{ name: 'customSecret', environment: 'staging' }] }
    });
    // secret exists in mockSecretsByName → decrypted
    expect(result[0].params.customSecret).toBe('decrypted(encrypted-custom)');
  });

  it('adds ownerId filter in queries', async () => {
    const controls = [
      { id: 8, params: { secretRefs: [{ id: 'uuid-1' }, { name: 'ghToken' }] } }
    ];
    await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn, ownerId: 101 });
    expect(SecretModel.findAll).toHaveBeenNthCalledWith(1, {
      where: { id: { [Op.in]: ['uuid-1'] }, ownerId: 101 }
    });
    expect(SecretModel.findAll).toHaveBeenNthCalledWith(2, {
      where: { [Op.or]: [{ name: 'ghToken', environment: 'production' }], ownerId: 101 }
    });
  });
  it('records DUPLICATE_KEY errors if same key resolved twice', async () => {
    const controls = [
      {
        id: 9,
        params: {
          secretRefs: [
            { id: 'uuid-1', as: 'sameKey' },
            { name: 'ghToken', environment: 'development', as: 'sameKey' },
          ]
        }
      }
    ];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].secretErrors.some(e => e.error === 'DUPLICATE_KEY')).toBe(true);
  });
  it('marks error when ref has neither id nor name', async () => {
    const controls = [{ id: 20, params: { secretRefs: [{}] } }];
    const result = await hydrateControlsWithSecrets(controls, { SecretModel, decryptFn });
    expect(result[0].params).toEqual({ undefined: undefined });
    expect(result[0].secretErrors[0].error).toBe('NOT_FOUND');
  });
});
