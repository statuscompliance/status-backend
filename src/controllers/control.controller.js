import models from '../../db/models.js'

export const getControls = async (req, res) => {
    // const [rows] = await pool.query('SELECT * FROM control')
    const rows = await models.Control.findAll();
    res.json(rows)
}

export const getControl = async (req, res) => {
    // const [rows] = await pool.query('SELECT * FROM control WHERE id = ?', [req.params.id])
    const rows = await models.Control.findByPk(req.params.id);

    if(rows.length <= 0) return res.status(404).json({
        message: 'Control not found'
    })

    res.json(rows[0])
}

export const getCatalogControls = async (req, res) => {
    // const [rows] = await pool.query('SELECT * FROM control WHERE catalog_id = ?', [req.params.id])
    const rows = await models.Control.findAll({
        where: {
            catalog_id: req.params.id
        }
    });

    if(rows.length <= 0) return res.status(404).json({
        message: 'Catalog not found'
    })

    res.json(rows)
}

export const createControl = async (req, res) => {
    const {name,description,period,startDate,endDate,mashup_id,catalog_id} = req.body
    const rows = await models.Control.create({
        name,
        description,
        period,
        startDate,
        endDate,
        mashup_id,
        catalog_id
    });

    res.send({
        id: rows.id,
        name,
        description,
        period,
        startDate,
        endDate,
        mashup_id,
        catalog_id,
    })
}

export const updateControl = async (req, res) => {
    const {id} = req.params
    const {name,description,period,startDate,endDate,mashup_id,catalog_id} = req.body

    // const [result] = await pool.query('UPDATE control SET name = IFNULL(?, name), description = IFNULL(?, description), period = IFNULL(?, period), startDate = IFNULL(?, startDate), endDate = IFNULL(?, endDate), mashup_id = IFNULL(?, mashup_id), catalog_id = IFNULL(?, catalog_id) WHERE id = ?', [name, description, period, startDate, endDate, mashup_id, catalog_id, id])

    const result = await models.Control.update({
        name,
        description,
        period,
        startDate,
        endDate,
        mashup_id,
        catalog_id
    }, {
        where: {
            id
        }
    });

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Control not found'
    })

    // const [rows] = await pool.query('SELECT * FROM control WHERE id = ?', [id])

    const rows = await models.Control.findByPk(id);

    res.json(rows[0])
}

export const deleteControl = async (req, res) => {
    // const [result] = await pool.query('DELETE FROM control WHERE id = ?', [req.params.id])

    const result = await models.Control.destroy({
        where: {
            id: req.params.id
        }
    });

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Control not found'
    })

    res.sendStatus(204)
}