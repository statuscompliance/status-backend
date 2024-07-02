import models from '../../db/models.js'

export const getInputControls = async (req, res) => {
    const rows = await models.InputControl.findAll();
    res.json(rows)
}

export const getInputControl = async (req, res) => {
    const row = await models.InputControl.findByPk(req.params.id);

    if (!row)
        return res.status(404).json({
          message: "InputControl not found",
        });
    
    res.json(row);
}

export const getValuesByInputIdAndControlId = async (req, res) => {
    const {input_id, control_id} = req.params

    let result = await models.InputControl.findOne({
        where: {
            input_id: input_id,
            control_id: control_id
        }
    });

    if (result <= 0)
        result = ""
    
    res.json(result);
};

export const createInputControl = async (req, res) => {
    const {value, input_id, control_id} = req.body

    if (!await models.Control.findByPk(control_id))
        return res.status(404).json({
          message: "Control not found",
        });

    if (!await models.Input.findByPk(input_id))
        return res.status(404).json({
            message: "Input not found",
        });

    const row = await models.InputControl.create({
        value,
        input_id,
        control_id
    });

    res.send({
        id: row.id,
        value,
        input_id,
        control_id,
    })
}

export const updateInputControl = async (req, res) => {
    const {id} = req.params
    const {value, input_id, control_id} = req.body

    const currentInputControl = await models.InputControl.findByPk(id);
    if (!currentInputControl) {
        return res.status(404).json({ message: 'InputControl not found' });
    }

    await models.InputControl.update({
        value,
        input_id,
        control_id
    }, {
        where: {
            id
        }
    });
    
    const row = await models.InputControl.findByPk(id);
    res.json(row);
}

export const deleteInputControl = async (req, res) => {
    const result = await models.InputControl.destroy({
        where: {
            id: req.params.id
        }
    });

    if (result <= 0)
        return res.status(404).json({
          message: "InputControl not found",
        });
    
    res.sendStatus(204);
}