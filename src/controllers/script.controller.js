import redis from '../config/redis.js';
import { v4 as uuidv4 } from 'uuid';

const SCRIPT_KEY_PREFIX = 'script:';

// Helper to build unique keys
const buildKey = (id) => `${SCRIPT_KEY_PREFIX}${id}`;

export const createScript = async (req, res) => {
  try {
    const {code, metadata } = req.body;
    const id = uuidv4();

    if (!code) {
      return res.status(400).json({ error: 'Code is required.' });
    }

    if (!code.includes('module.exports.main')) {
      return res.status(400).json({ error: 'The code must include a module.exports.main function.' });
    }
    const scriptData = {
      code,
      metadata: metadata || {},
      createdAt: new Date().toISOString(),
    };
    await redis.set(buildKey(id), JSON.stringify(scriptData));
    return res.status(201).json({ message: 'Script created successfully', id });
  } catch (error) {
    console.error('Error creating script:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getAllScripts = async (req, res) => {
  try {
    const keys = await redis.keys(`${SCRIPT_KEY_PREFIX}*`);
    const scripts = [];

    for (const key of keys) {
      const scriptData = await redis.get(key);
      scripts.push({ id: key.replace(SCRIPT_KEY_PREFIX, ''), ...JSON.parse(scriptData) });
    };
    
    return res.status(200).json(scripts);
  } catch (error) {
    console.error('Error getting all scripts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const getScriptById = async (req, res) => {
  try {
    const { id } = req.params;
    const scriptData = await redis.get(buildKey(id));

    if (!scriptData) {
      return res.status(404).json({ error: 'Script not found' });
    }
    const jsCode = JSON.parse(scriptData).code;
    const parsedCode = jsCode.replace(/\\"/g, '"').replace(/\\n/g, '\n');

    return res.status(200).send(parsedCode);
  } catch (error) {
    console.error('Error getting script by ID:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const updateScript = async (req, res) => {
  try {
    const { id } = req.params;
    const { code, metadata } = req.body;

    const scriptData = await redis.get(buildKey(id));

    if (!scriptData) {
      return res.status(404).json({ error: 'Script not found' });
    }

    const updatedScript = {
      ...JSON.parse(scriptData),
      code: code || JSON.parse(scriptData).code,
      metadata: metadata || JSON.parse(scriptData).metadata,
      updatedAt: new Date().toISOString(),
    };

    await redis.set(buildKey(id), JSON.stringify(updatedScript));
    return res.status(200).json({ message: 'Script updated successfully' });
  } catch (error) {
    console.error('Error updating script:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteScript = async (req, res) => {
  try {
    const { id } = req.params;

    const scriptData = await redis.get(buildKey(id));

    if (!scriptData) {
      return res.status(404).json({ error: 'Script not found' });
    }

    await redis.del(buildKey(id));
    return res.status(200).json({ message: 'Script deleted successfully' });
  } catch (error) {
    console.error('Error deleting script:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};


export const deleteAllScripts = async (req, res) => {
  try {
    const keys = await redis.keys(`${SCRIPT_KEY_PREFIX}*`);

    for (const key of keys) {
      await redis.del(key);
    }

    return res.status(200).json({ message: 'All scripts deleted successfully' });
  } catch (error) {
    console.error('Error deleting all scripts:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}


export const parseScript = async (req, res) => {
  try {
    const code = req.body;
    if (!code.includes('module.exports.main')) {
      return res.status(400).json({ error: 'The code must include a module.exports.main function.' });
    }
    let parsedCode = code.replace(/\n/g, '\n').replace(/ {4}/g, '\t');
    parsedCode = JSON.stringify(parsedCode);
    return res.status(200).send(parsedCode);
  } catch (error) {
    console.error('Error parsing script:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
};