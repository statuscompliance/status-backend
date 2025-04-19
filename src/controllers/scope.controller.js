import { models } from '../models/models.js';
import ScopeSet from '../models/scopeSet.model.js';

export async function getAllScopes(req, res) {
  try {
    const scopes = await models.Scope.findAll();
    res.status(200).json(scopes);
  } catch (error) {
    console.error('Error retrieving scopes:', error);
    res.status(500).json({ error: 'Failed to retrieve scopes' });
  }
}

export async function getScopeById(req, res) {
  try {
    const { id } = req.params;

    const scope = await models.Scope.findByPk(id);
    if (scope) {
      res.status(200).json(scope);
    } else {
      res.status(404).json({ error: 'Scope not found' });
    }
  } catch (error) {
    console.error('Error retrieving scope:', error);
    res.status(500).json({ error: 'Failed to retrieve scope by ID' });
  }
}

export async function createScope(req, res) {
  try {
    
    let { name, description, type, default: defaultValue } = req.body;
    
    if (typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }
    const normalizedName = name.toLowerCase().replace(/\s+/g, '_');
    
    const scopeData = {
      name: normalizedName,
      description,
      type,
      default: defaultValue,
    };
    const newScope = await models.Scope.create(scopeData);
    res.status(201).json(newScope);
  } catch (error) {
    console.error('Failed to create scope:', error);
    res.status(400).json({ error: 'Failed to create scope' });
  }
}

export async function updateScope(req, res) {
  try {   
    const { id } = req.params;

    // Extract and validate the request body.
    const { name, description, type, default: defaultValue } = req.body;
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Name must be a string' });
    }

    // Normalize the name to lowercase and replace spaces with underscores.
    const updatedData = {
      name: name.toLowerCase().replace(/\s+/g, '_'),
      description,
      type,
      default: defaultValue,
    };
    // Check if the scope exists before updating.
    const [updated] = await models.Scope.update(updatedData, { where: { id } });
    if (!updated) {
      return res.status(404).json({ error: 'Scope not found' });
    }

    // Fetch the updated scope to return it in the response.
    const updatedScope = await models.Scope.findByPk(id);
    if (!updatedScope) {
      return res.status(404).json({ error: 'Scope not found after update' });
    }

    return res.status(200).json(updatedScope);
  } catch (error) {
    console.error('Failed to update scope', error);
    return res.status(400).json({ error: 'Failed to update scope' });
  }
}

export async function deleteScope(req, res) {
  try {
    // Validate the ID parameter.
    const { id } = req.params;
    // Check if the scope exists before attempting to delete it.
    const deleted = await models.Scope.destroy({ where: { id } });
    if (deleted > 0) {
      return res.status(204).send();
    } else {
      return res.status(404).json({ error: 'Scope not found' });
    }
  } catch (error) {
    console.error('Failed to delete scope', error);
    return res.status(500).json({ error: 'Failed to delete scope' });
  }
}

export async function createScopeSet(req, res) {
  try {
    const { controlId, scopes } = req.body;
    const newScopeSet = new ScopeSet({ controlId, scopes });
    await newScopeSet.save();
    res.status(201).json(newScopeSet);
  } catch (error) {
    console.error('Failed to create scope set', error);
    res.status(500).json({ error: 'Failed to create scope set' });
  }
}

export async function getAllScopeSets(req, res) {
  try {
    const scopeSets = await ScopeSet.find();
    res.status(200).json(scopeSets);
  } catch (error) {
    console.error('Failed to retrieve all scope sets', error);
    res.status(500).json({ error: 'Failed to retrieve all scope sets' });
  }
}

export async function getScopeSetsByControlId(req, res) {
  try {
    const { controlId } = req.params;
    const scopeSets = await ScopeSet.find({ controlId });
    res.status(200).json(scopeSets);
  } catch (error) {
    console.error('Failed to retrieve scope sets by control ID', error);
    res.status(500).json({ error: 'Failed to retrieve scope sets by control ID' });
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
  } catch (error) {
    console.error('Failed to update scope set by ID', error);
    res.status(500).json({ error: 'Failed to update scope set by ID' });
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
  } catch (error) {
    console.error('Failed to retrieve scope set by ID', error);
    res.status(500).json({ error: 'Failed to retrieve scope set by ID' });
  }
}
