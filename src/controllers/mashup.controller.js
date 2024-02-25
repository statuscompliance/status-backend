import {pool} from '../db.js'

export const getMashups = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM mashup')
    res.json(rows)
}

export const getMashup = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM mashup WHERE id = ?', [req.params.id])

    if(rows.length <= 0) return res.status(404).json({
        message: 'Mashup not found'
    })

    res.json(rows[0])
}

export const createMashup = async (req, res) => {
    const {name, description, url} = req.body
    const [rows] = await pool.query('INSERT INTO mashup (name,description,url) VALUES(?,?,?)', [name,description,url])
    res.send({
        id: rows.insertId,
        name,
        description,
        url,
    })
}

export const updateMashup = async (req, res) => {
    const {id} = req.params
    const {name, description, url} = req.body

    const [result] = await pool.query('UPDATE mashup SET name = IFNULL(?, name), description = IFNULL(?, description), url = IFNULL(?, url) WHERE id = ?', [name, description, url, id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Mashup not found'
    })

    const [rows] = await pool.query('SELECT * FROM mashup WHERE id = ?', [id])

    res.json(rows[0])
}

export const deleteMashup = async (req, res) => {
    const [result] = await pool.query('DELETE FROM mashup WHERE id = ?', [req.params.id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Mashup not found'
    })

    res.sendStatus(204)
}