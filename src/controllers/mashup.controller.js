import models from '../../db/models.js'

export const getMashups = async (req, res) => {
    const rows = await models.Mashup.findAll();
    res.json(rows);
}

export const getMashup = async (req, res) => {
    const row = await models.Mashup.findByPk(req.params.id);

    if (!row) return res.status(404).json({
        message: 'Mashup not found'
    });

    res.json(row);
}

export const createMashup = async (req, res) => {
    const { name, description, url } = req.body;
    const row = await models.Mashup.create({
        name,
        description,
        url
    });

    res.send({
        id: row.id,
        name,
        description,
        url,
    });
}

export const updateMashup = async (req, res) => {
    const { id } = req.params;
    const { name, description, url } = req.body;

    const currentMashup = await models.Mashup.findByPk(id);
    if (!currentMashup) {
        return res.status(404).json({ message: 'Mashup not found' });
    }

    await models.Mashup.update({
        name,
        description,
        url
    }, {
        where: {
            id
        }
    });

    const row = await models.Mashup.findByPk(id);
    res.json(row);
}

export const deleteMashup = async (req, res) => {
    const result = await models.Mashup.destroy({
        where: {
            id: req.params.id
        }
    });

    if (result === 0) return res.status(404).json({
        message: 'Mashup not found'
    });

    res.sendStatus(204);
}
