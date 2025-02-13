import models from '../models/models.js';

export async function getAllScopes(req, res) {
  try {
    const scopes = await models.Scope.findAll();
    res.status(200).json(scopes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function getScopeById(req, res) {
  try {
    const scope = await models.Scope.findByPk(req.params.id);
    if (scope) {
      res.status(200).json(scope);
    } else {
      res.status(404).json({ error: 'Scope not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function createScope(req, res) {
  try {
    const { name, description, type, default: defaultValue } = req.body;
    const newScope = await models.Scope.create({ name, description, type, default: defaultValue });
    res.status(201).json(newScope);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function updateScope(req, res) {
  try {
    const { name, description, type, default: defaultValue } = req.body;
    const [updated] = await models.Scope.update(
      { name, description, type, default: defaultValue },
      { where: { id: req.params.id } }
    );
    if (updated) {
      const updatedScope = await models.Scope.findByPk(req.params.id);
      res.status(200).json(updatedScope);
    } else {
      res.status(404).json({ error: 'Scope not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export async function deleteScope(req, res) {
  try {
    const deleted = await models.Scope.destroy({ where: { id: req.params.id } });
    if (deleted) {
      res.status(204).send();
    } else {
      res.status(404).json({ error: 'Scope not found' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}