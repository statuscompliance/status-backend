import models from '../models/models.js';
import ScopeSet from '../models/scopeSet.model.js';

export async function getAllScopes(req, res) {
  try {
    const scopes = await models.Scope.findAll();
    res.status(200).json(scopes);
  } catch (error) {
    console.error('Error retrieving scopes:', error);
    res.status(500).json({ error: 'Error retrieving scopes' });
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
    console.error('Error retrieving scope:', error);
    res.status(500).json({ error: 'Error retrieving scope' });
  }
}

export async function createScope(req, res) {
  try {
    /*
    let { name, description, type, default: defaultValue } = req.body;
    
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    name = name.toLowerCase().replace(/\s+/g, '_'); //DELETE ¿?
    
    const newScope = await models.Scope.create({ name, description, type, default: defaultValue });
    */
    const newScope = await models.Scope.create(req.body);
    res.status(201).json(newScope);
  } catch (error) {
    console.error('Error creating scope:', error);
    res.status(400).json({ error: 'Error creating scope' });
  }
}

export async function updateScope(req, res) {
  try {
    /*
    let { name, description, type, default: defaultValue } = req.body;
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    name = name.toLowerCase().replace(/\s+/g, '_');
    const [updated] = await models.Scope.update(
      { name, description, type, default: defaultValue },
      { where: { id: req.params.id } }
    );*/
    const [updated] = await models.Scope.update(req.body, {
      where: { id: req.params.id },
    });
    if (updated) {
      const updatedScope = await models.Scope.findByPk(req.params.id);
      res.status(200).json(updatedScope);
    } else {
      res.status(404).json({ error: 'Scope not found' });
    }
  } catch (error) {
    console.error('Error updating scope:', error);
    res.status(400).json({ error: 'Error updating scope' });
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
    console.error('Error deleting scope:', error);
    res.status(500).json({ error: 'Error deleting scope' });
  }
}

export async function createScopeSet(req, res) {
  try {
    const { controlId, scopes } = req.body;
    const newScopeSet = new ScopeSet({ controlId, scopes });
    await newScopeSet.save();
    res.status(201).json(newScopeSet);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getAllScopeSets(req, res) {
  try {
    const scopeSets = await ScopeSet.find();
    res.status(200).json(scopeSets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getScopeSetsByControlId(req, res) {
  try {
    const { controlId } = req.params;
    const scopeSets = await ScopeSet.find({ controlId });
    res.status(200).json(scopeSets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateScopeSetById(req, res) {
  try {
    const { id } = req.params;
    const { controlId, scopes } = req.body;
    const updatedScopeSet = await ScopeSet.findByIdAndUpdate(id, { controlId, scopes }, { new: true });
    if (updatedScopeSet) {
      res.status(200).json(updatedScopeSet);
    } else {
      res.status(404).json({ error: 'ScopeSet not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getScopeSetById(req, res) {
  try {
    const { id } = req.params;
    const scopeSet = await ScopeSet.findById(id);
    if (scopeSet) {
      res.status(200).json(scopeSet);
    } else {
      res.status(404).json({ error: 'ScopeSet not found' });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}