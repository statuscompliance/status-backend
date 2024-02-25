import {pool} from '../db.js'

export const getControls = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM control')
    res.json(rows)
}

export const getControl = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM control WHERE id = ?', [req.params.id])

    if(rows.length <= 0) return res.status(404).json({
        message: 'Control not found'
    })

    res.json(rows[0])
}

export const getCatalogControls = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM control WHERE catalog_id = ?', [req.params.id])

    if(rows.length <= 0) return res.status(404).json({
        message: 'Catalog not found'
    })

    res.json(rows)
}

export const createControl = async (req, res) => {
    const {name,description,operator,term,period,startDate,endDate,mashup_id,catalog_id} = req.body
    const [rows] = await pool.query('INSERT INTO control (name,description,operator,term,period,startDate,endDate,mashup_id,catalog_id) VALUES(?,?,?,?,?,?,?,?,?)', [name,description,operator,term,period,startDate,endDate,mashup_id,catalog_id])
    res.send({
        id: rows.insertId,
        name,
        description,
        operator,
        term,
        period,
        startDate,
        endDate,
        mashup_id,
        catalog_id,
    })
}

export const updateControl = async (req, res) => {
    const {id} = req.params
    const {name,description,operator,term,period,startDate,endDate,mashup_id,catalog_id} = req.body

    const [result] = await pool.query('UPDATE control SET name = IFNULL(?, name), description = IFNULL(?, description), operator = IFNULL(?, operator), term = IFNULL(?, term), period = IFNULL(?, period), startDate = IFNULL(?, startDate), endDate = IFNULL(?, endDate), mashup_id = IFNULL(?, mashup_id), catalog_id = IFNULL(?, catalog_id) WHERE id = ?', [name, description, operator, term, period, startDate, endDate, mashup_id, catalog_id, id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Control not found'
    })

    const [rows] = await pool.query('SELECT * FROM control WHERE id = ?', [id])

    res.json(rows[0])
}

export const deleteControl = async (req, res) => {
    const [result] = await pool.query('DELETE FROM control WHERE id = ?', [req.params.id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Control not found'
    })

    res.sendStatus(204)
}