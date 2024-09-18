import models from '../../db/models.js'

export const getControls = async (req, res) => {
    const rows = await models.Control.findAll();
    res.json(rows);
}

export const getControl = async (req, res) => {
    const row = await models.Control.findByPk(req.params.id);

    if (!row)
        return res.status(404).json({
          message: "Control not found",
        });
        
    res.json(row);
}

export const getCatalogControls = async (req, res) => {
    const rows = await models.Control.findAll({
        where: {
            catalog_id: req.params.catalog_id
        }
    });

    res.json(rows);
}

export const getInputControlsByControlId = async (req, res) => {
    const rows = await models.InputControl.findAll({
        where: {
            control_id: req.params.id
        }
    });
  
    res.json(rows);
};

export const createControl = async (req, res) => {
    const {name,description,period,mashup_id,catalog_id} = req.body
    const rows = await models.Control.create({
        name,
        description,
        period,
        mashup_id,
        catalog_id
    });

    res.send({
        id: rows.id,
        name,
        description,
        period,
        mashup_id,
        catalog_id,
    })
}

export const updateControl = async (req, res) => {
    const {id} = req.params
    const {name,description,period,mashup_id,catalog_id} = req.body

    const currentControl = await models.Control.findByPk(id);
    if (!currentControl) {
        return res.status(404).json({ message: 'Control not found' });
    }

    await models.Control.update({
        name,
        description,
        period,
        mashup_id,
        catalog_id
    }, {
        where: {
            id
        }
    });
    
    const row = await models.Control.findByPk(id);
    res.json(row);
}

export const deleteControl = async (req, res) => {
    const result = await models.Control.destroy({
        where: {
            id: req.params.id
        }
    });

    if (result <= 0)
        return res.status(404).json({
          message: "Control not found",
        });
    
    res.sendStatus(204);
}

export const deleteInputControlsByControlId = async (req, res) => {
    await models.InputControl.destroy({
        where: {
            control_id: req.params.id
        }
    });

    res.sendStatus(204);
};
