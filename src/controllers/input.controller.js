import {pool} from '../db.js'

export const getInputs = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM input')
    res.json(rows)
}

export const getInput = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM input WHERE id = ?', [req.params.id])

    if(rows.length <= 0) return res.status(404).json({
        message: 'Input not found'
    })

    res.json(rows[0])
}

export const getInputsByMashupId = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM input WHERE mashup_id = ?', [req.params.id])

    if(rows.length <= 0) return res.status(404).json({
        message: 'The mashup has no inputs'
    })

    res.json(rows)
}

export const createInput = async (req, res) => {
    const {name, type, mashup_id} = req.body
    const [rows] = await pool.query('INSERT INTO input (name,type,mashup_id) VALUES(?,?,?)', [name,type,mashup_id])
    res.send({
        id: rows.insertId,
        name,
        type,
        mashup_id,
    })
}

export const updateInput = async (req, res) => {
    const {id} = req.params
    const {name, type, mashup_id} = req.body

    const [result] = await pool.query('UPDATE input SET name = IFNULL(?, name), type = IFNULL(?, type), mashup_id = IFNULL(?, mashup_id) WHERE id = ?', [name, type, mashup_id, id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Input not found'
    })

    const [rows] = await pool.query('SELECT * FROM input WHERE id = ?', [id])

    res.json(rows[0])
}

export const deleteInput = async (req, res) => {
    const [result] = await pool.query('DELETE FROM input WHERE id = ?', [req.params.id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Input not found'
    })

    res.sendStatus(204)
}