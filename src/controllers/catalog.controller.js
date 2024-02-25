import {pool} from '../db.js'

export const getCatalogs = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM catalog')
    res.json(rows)
}

export const getCatalog = async (req, res) => {
    const [rows] = await pool.query('SELECT * FROM catalog WHERE id = ?', [req.params.id])

    if(rows.length <= 0) return res.status(404).json({
        message: 'Catalog not found'
    })

    res.json(rows[0])
}

export const createCatalog = async (req, res) => {
    const {name,url} = req.body
    const [rows] = await pool.query('INSERT INTO catalog (name,url) VALUES(?,?)', [name,url])
    res.send({
        id: rows.insertId,
        name,
        url,
    })
}

export const updateCatalog = async (req, res) => {
    const {id} = req.params
    const {name,url} = req.body

    const [result] = await pool.query('UPDATE catalog SET name = IFNULL(?, name), url = IFNULL(?, url) WHERE id = ?', [name, url, id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Catalog not found'
    })

    const [rows] = await pool.query('SELECT * FROM catalog WHERE id = ?', [id])

    res.json(rows[0])
}

export const deleteCatalog = async (req, res) => {
    const [result] = await pool.query('DELETE FROM catalog WHERE id = ?', [req.params.id])

    if(result.affectedRows <= 0) return res.status(404).json({
        message: 'Catalog not found'
    })

    res.sendStatus(204)
}