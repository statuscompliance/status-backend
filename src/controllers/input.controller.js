import models from "../../db/models.js"

export const getInputs = async (req, res) => {
    const [rows] = await models.Input.findAll();
    res.json(rows)
}

export const getInput = async (req, res) => {
    const [rows] = await models.Input.findByPk(req.params.id);

    if(rows.length <= 0) return res.status(404).json({
        message: 'Input not found'
    })

    res.json(rows[0])
}

export const getInputsByMashupId = async (req, res) => {
    const [rows] = await models.Input.findAll({
        where: {
            mashup_id: req.params.id
        }
    });

    if(rows.length <= 0) return res.status(404).json({
        message: 'The mashup has no inputs'
    })

    res.json(rows)
}

export const createInput = async (req, res) => {
    const {name, type, mashup_id} = req.body
    const rows = await models.Input.create({
        name,
        type,
        mashup_id
    });

    res.send({
        id: rows.id,
        name,
        type,
        mashup_id,
    })
}

export const updateInput = async (req, res) => {
    const {id} = req.params
    const {name, type, mashup_id} = req.body
    const result = await models.Input.update({
        name,
        type,
        mashup_id
    }, {
        where: {
            id
        }
    });

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Input not found'
    })
    const [rows] = await models.Input.findByPk(id);

    res.json(rows[0])
}

export const deleteInput = async (req, res) => {
    const result = await models.Input.destroy({
        where: {
            id: req.params.id
        }
    });

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Input not found'
    })

    res.sendStatus(204)
}