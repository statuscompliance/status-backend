import { Op } from 'sequelize';
import { decrypt } from '../config/encryption.js';

/**
 * Hydrates an array of controls by injecting secrets directly into `params`.
 * - If secret references exist (by id, name, and/or environment), they are resolved and decrypted.
 * - Secrets are added as keys inside `params`, using `ref.as` if defined,
 *   or falling back to the secret name / ref.name / ref.id.
 * - The `secretRefs` property is removed from `params` in the final output.
 *
 * @param {Object[]} controls - Controls (plain objects or Sequelize instances).
 * @param {Object} options
 * @param {SequelizeModel} options.SecretModel - Sequelize model for secrets.
 * @param {string} [options.defaultEnvironment='production'] - Default environment for refs without `environment`.
 * @param {number} [options.ownerId] - Optional filter by ownerId.
 * @param {Function} [options.decryptFn=decrypt] - Decryption function (fallback if no `secret.value`).
 * @returns {Promise<Object[]>} - Controls with secrets injected in `params`.
 */
export async function hydrateControlsWithSecrets(
  controls,
  {
    SecretModel,
    defaultEnvironment = 'production',
    ownerId,
    decryptFn = decrypt
  }
) {
  if (!Array.isArray(controls) || controls.length === 0) return controls;

  // Normalize Sequelize instances to plain objects and ensure `params` exists
  const normalized = controls.map(c => {
    const plain = c.get ? c.get({ plain: true }) : c;
    return {
      ...plain,
      params: plain.params ?? {},
    };
  });

  // Extract all secretRefs from controls
  const allRefs = normalized.flatMap(c =>
    Array.isArray(c.params.secretRefs) ? c.params.secretRefs : []
  );

  // If there are no refs, return controls cleaned (removing secretRefs if present)
  if (allRefs.length === 0) {
    return normalized.map(c => {
      const cleanParams = { ...c.params };
      delete cleanParams.secretRefs;
      return { ...c, params: cleanParams };
    });
  }

  // Split refs by ID and by name+environment
  const byIds = new Set();
  const byNameEnv = [];

  for (const ref of allRefs) {
    if (ref.id) {
      byIds.add(ref.id);
    } else if (ref.name) {
      byNameEnv.push({
        name: ref.name,
        environment: ref.environment || defaultEnvironment,
      });
    }
  }

  // Fetch secrets by ID
  const idSecrets = byIds.size
    ? await SecretModel.findAll({
      where: {
        id: { [Op.in]: [...byIds] },
        ...(ownerId ? { ownerId } : {})
      }
    })
    : [];

  // Fetch secrets by name and environment
  const nameSecrets = byNameEnv.length
    ? await SecretModel.findAll({
      where: {
        [Op.or]: byNameEnv,
        ...(ownerId ? { ownerId } : {})
      }
    })
    : [];

  // Create lookup maps
  const byIdMap = new Map(idSecrets.map(s => [s.id, s]));
  const byNameEnvMap = new Map(
    nameSecrets.map(s => [`${s.name}::${s.environment}`, s])
  );

  // Helper: resolve a single ref
  function resolveSecret(ref) {
    let secret;
    if (ref.id) {
      secret = byIdMap.get(ref.id);
    } else if (ref.name) {
      const key = `${ref.name}::${ref.environment || defaultEnvironment}`;
      secret = byNameEnvMap.get(key);
    }

    // Compute the key name: prefer `as`, then ref.name, then ref.id
    const keyName = ref.as || ref.name || ref.id;

    // Missing or invalid secret
    if (!secret || !secret.valueEncrypted) {
      return { key: keyName, value: undefined, error: 'NOT_FOUND' };
    }

    try {
      const value = secret.value ?? decryptFn(secret.valueEncrypted);
      return { key: keyName, value };
    } catch {
      return { key: keyName, value: undefined, error: 'DECRYPT_ERROR' };
    }
  }

  // Resolve and inject
  return normalized.map(c => {
    const refs = Array.isArray(c.params.secretRefs) ? c.params.secretRefs : [];
    const resolvedSecrets = {};
    const errors = [];

    for (const ref of refs) {
      const { key, value, error } = resolveSecret(ref);

      // Prevent silent overwrites
      if (resolvedSecrets[key] !== undefined) {
        errors.push({ ref, error: 'DUPLICATE_KEY' });
      }

      resolvedSecrets[key] = value;
      if (error) errors.push({ ref, error });
    }

    const cleanParams = { ...c.params, ...resolvedSecrets };
    delete cleanParams.secretRefs;

    return {
      ...c,
      params: cleanParams,
      ...(errors.length > 0 ? { secretErrors: errors } : {}),
    };
  });
}
