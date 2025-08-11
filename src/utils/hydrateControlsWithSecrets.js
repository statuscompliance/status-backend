import { Op } from 'sequelize';
import { decrypt } from '../config/encryption.js';

/**
 * Hydrates an array of controls with decrypted secrets using a single optimized query.
 *
 * @param {Object[]} controls - Controls (plain objects or Sequelize instances).
 * @param {Object} options
 * @param {SequelizeModel} options.SecretModel - Sequelize model for secrets.
 * @param {string} [options.defaultEnvironment='production'] - Default environment for name-based refs.
 * @param {number} [options.ownerId] - Optional owner filter.
 * @param {Function} [options.decryptFn=decrypt] - Decryption function.
 * @returns {Promise<Object[]>} - Controls with `resolvedSecrets` attached.
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
  // Return early if there are no controls to process
  if (!Array.isArray(controls) || controls.length === 0) return controls;

  // Normalize Sequelize instances to plain objects and ensure `params` exists
  const normalized = controls.map(c => {
    const plain = c.get ? c.get({ plain: true }) : c;
    return {
      ...plain,
      params: plain.params ?? {},
    };
  });

  // Extract all secretRefs from controls (if any)
  const allRefs = normalized.flatMap(c =>
    Array.isArray(c.params.secretRefs) ? c.params.secretRefs : []
  );

  // If no references found, return controls with empty resolvedSecrets
  if (allRefs.length === 0) {
    return normalized.map(c => ({ ...c, resolvedSecrets: {} }));
  }

  // Separate references by type: direct ID vs name + environment
  const byIds = new Set();
  const byNameEnv = [];

  for (const ref of allRefs) {
    if (ref.id) byIds.add(ref.id);
    else if (ref.name) {
      byNameEnv.push({
        name: ref.name,
        environment: ref.environment || defaultEnvironment
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

  // Create lookup maps for fast reference resolution
  const byIdMap = new Map(idSecrets.map(s => [s.id, s]));
  const byNameEnvMap = new Map(
    nameSecrets.map(s => [`${s.name}::${s.environment}`, s])
  );

  // Resolve and decrypt each secretRef in each control
  return normalized.map(c => {
    const refs = Array.isArray(c.params.secretRefs) ? c.params.secretRefs : [];
    const resolvedSecrets = {};

    for (const ref of refs) {
      let secret;

      // Resolve by ID or by name+env
      if (ref.id) {
        secret = byIdMap.get(ref.id);
      } else if (ref.name) {
        const key = `${ref.name}::${ref.environment || defaultEnvironment}`;
        secret = byNameEnvMap.get(key);
      }

      // If secret is missing or corrupted, set value as undefined
      if (!secret || !secret.valueEncrypted) {
        resolvedSecrets[ref.as || ref.name || ref.id] = undefined;
        continue;
      }

      // Attempt to decrypt the secret
      let value;
      try {
        value = decryptFn(secret.valueEncrypted);
      } catch {
        value = undefined;
      }

      // Store decrypted value using alias (if defined), otherwise fallback
      resolvedSecrets[ref.as || secret.name] = value;
    }

    return { ...c, resolvedSecrets };
  });
};
