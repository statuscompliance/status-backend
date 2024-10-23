import models from "../../db/models.js";

export const getCatalogs = async (req, res) => {
    const catalogs = await models.Catalog.findAll();
    res.json(catalogs);
};

export const getCatalog = async (req, res) => {
    const row = await models.Catalog.findByPk(req.params.id);

    if (!row)
        return res.status(404).json({
            message: "Catalog not found",
        });

    res.json(row);
};

export const createCatalog = async (req, res) => {
    const { name, startDate, endDate, dashboard_id } = req.body;
    const rows = await models.Catalog.create({
        name,
        startDate,
        endDate,
        dashboard_id,
    });
    res.send({
        id: rows.id,
        name,
        startDate,
        endDate,
        dashboard_id,
    });
};

export const updateCatalog = async (req, res) => {
    const { id } = req.params;
    const { name, startDate, endDate, dashboard_id } = req.body;

    const currentCatalog = await models.Catalog.findByPk(id);
    if (!currentCatalog) {
        return res.status(404).json({ message: "Catalog not found" });
    }

    await models.Catalog.update(
        {
            name,
            startDate,
            endDate,
            dashboard_id,
        },
        {
            where: {
                id,
            },
        }
    );

    const row = await models.Catalog.findByPk(id);

    res.json(row);
};

export const deleteCatalog = async (req, res) => {
    const result = await models.Catalog.destroy({
        where: {
            id: req.params.id,
        },
    });

    if (result <= 0)
        return res.status(404).json({
            message: "Catalog not found",
        });

    res.sendStatus(204);
};
