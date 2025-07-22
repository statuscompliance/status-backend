import { models } from '../models/models.js';
import { encrypt } from '../config/encryption.js';


const sanitizeSecret = (secret, masked = true) => ({
  id: secret.id,
  name: secret.name,
  type: secret.type,
  environment: secret.environment,
  createdBy: secret.createdBy,
  version: secret.version,
  rotatedAt: secret.rotatedAt,
  createdAt: secret.createdAt,
  updatedAt: secret.updatedAt,
  value: masked ? '********' : secret.value, // only displayed in create
});

const checkOwnership = (secret, userId) =>
  secret && secret.ownerId === userId;

export const listSecrets = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const secrets = await models.Secret.findAll({
      where: { ownerId: userId },
      attributes: { exclude: ['valueEncrypted'] },
    });

    const sanitized = secrets.map((s) => sanitizeSecret(s));
    res.json(sanitized);
  } catch (error) {
    console.error('Error listing secrets:', error);
    res.status(500).json({ message: 'Error listing secrets', error: error.message });
  }
};

export const getSecret = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const secret = await models.Secret.findByPk(id, {
      attributes: { exclude: ['valueEncrypted'] },
    });

    if (!checkOwnership(secret, userId)) {
      return res.status(404).json({ message: 'Secret not found or access denied' });
    }

    res.json(sanitizeSecret(secret));
  } catch (error) {
    console.error('Error fetching secret:', error);
    res.status(500).json({ message: 'Error fetching secret', error: error.message });
  }
};

export const createSecret = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, type, environment, value } = req.body;
    if (!value) {
      return res.status(400).json({ message: 'Secret value is required.' });
    }

    const valueEncrypted = encrypt(value);

    const secretData = {
      name,
      type,
      environment,
      valueEncrypted,
      createdBy: req.user.username,
      version: 1,
      rotatedAt: new Date(),
      ownerId: userId,
    };

    // For testing environment, get the next available ID since auto-increment is disabled
    /* istanbul ignore next */
    if (import.meta.env?.VITEST) {
      const lastSecret = await models.Secret.findOne({
        order: [['id', 'DESC']],
        attributes: ['id']
      });
      secretData.id = lastSecret ? lastSecret.id + 1 : 1;
    }

    const newSecret = await models.Secret.create(secretData);

    const response = sanitizeSecret({ ...newSecret.toJSON(), value }, false);
    res.status(201).json({ message: 'Secret created successfully', ...response });
  } catch (error) {
    console.error('Error creating secret:', error);
    res.status(500).json({ message: 'Error creating secret', error: error.message });
  }
};

export const updateSecret = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;
    const { name, type, environment, value } = req.body;

    const secret = await models.Secret.findByPk(id);
    if (!checkOwnership(secret, userId)) {
      return res.status(404).json({ message: 'Secret not found or access denied' });
    }

    const updateData = { updatedAt: new Date() };
    if (name) updateData.name = name;
    if (type) updateData.type = type;
    if (environment) updateData.environment = environment;

    if (value?.trim()) {
      updateData.valueEncrypted = encrypt(value);
      updateData.version = (secret.version || 0) + 1;
      updateData.rotatedAt = new Date();
    }

    await secret.update(updateData);

    res.json({ message: 'Secret updated successfully', ...sanitizeSecret(secret) });
  } catch (error) {
    console.error('Error updating secret:', error);
    res.status(500).json({ message: 'Error updating secret', error: error.message });
  }
};

export const deleteSecret = async (req, res) => {
  try {
    const userId = req.user?.user_id;
    const { id } = req.params;

    const secret = await models.Secret.findByPk(id);
    if (!checkOwnership(secret, userId)) {
      return res.status(404).json({ message: 'Secret not found or access denied' });
    }

    await secret.destroy();
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting secret:', error);
    res.status(500).json({ message: 'Error deleting secret', error: error.message });
  }
};
