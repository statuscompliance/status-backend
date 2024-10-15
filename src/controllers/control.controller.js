import models from "../../db/models.js";
import { methods } from "../grafana.js";

export const getControls = async (req, res) => {
    const rows = await models.Control.findAll();
    res.json(rows);
};

export const getControl = async (req, res) => {
    const row = await models.Control.findByPk(req.params.id);

    if (!row)
        return res.status(404).json({
            message: "Control not found",
        });

    res.json(row);
};

export const getCatalogControls = async (req, res) => {
    const rows = await models.Control.findAll({
        where: {
            catalog_id: req.params.catalog_id,
        },
    });

    res.json(rows);
};

export const getInputControlsByControlId = async (req, res) => {
    const rows = await models.InputControl.findAll({
        where: {
            control_id: req.params.id,
        },
    });

    res.json(rows);
};

export const createControl = async (req, res) => {
    const {
        name,
        description,
        period,
        startDate,
        endDate,
        mashup_id,
        catalog_id,
    } = req.body;

    const formattedStartDate = startDate ? new Date(startDate) : null;
    const formattedEndDate = endDate ? new Date(endDate) : null;

    const rows = await models.Control.create({
        name,
        description,
        period,
        startDate: formattedStartDate,
        endDate: formattedEndDate,
        mashup_id,
        catalog_id,
    });

    res.send({
        id: rows.id,
        name,
        description,
        period,
        formattedStartDate,
        formattedEndDate,
        mashup_id,
        catalog_id,
    });
};

export const updateControl = async (req, res) => {
    const { id } = req.params;
    const {
        name,
        description,
        period,
        startDate,
        endDate,
        mashup_id,
        catalog_id,
    } = req.body;

    const formattedStartDate = startDate ? new Date(startDate) : null;
    const formattedEndDate = endDate ? new Date(endDate) : null;

    const currentControl = await models.Control.findByPk(id);
    if (!currentControl) {
        return res.status(404).json({ message: "Control not found" });
    }

    await models.Control.update(
        {
            name,
            description,
            period,
            startDate: formattedStartDate,
            endDate: formattedEndDate,
            mashup_id,
            catalog_id,
        },
        {
            where: {
                id,
            },
        }
    );

    const row = await models.Control.findByPk(id);
    res.json(row);
};

export const deleteControl = async (req, res) => {
    const result = await models.Control.destroy({
        where: {
            id: req.params.id,
        },
    });

    if (result <= 0)
        return res.status(404).json({
            message: "Control not found",
        });

    res.sendStatus(204);
};

export const deleteInputControlsByControlId = async (req, res) => {
    await models.InputControl.destroy({
        where: {
            control_id: req.params.id,
        },
    });

    res.sendStatus(204);
};

export async function addPanelToControl(req, res) {
    const { id, panelId } = req.params;

    const { dashboardUid } = req.body;

    try {
        const panel = await models.Panel.create({
            id: panelId,
            control_id: id,
            dashboardUid: dashboardUid,
        });
        res.status(201).json({
            message: "Panel added to control",
            data: panel,
        });
    } catch (error) {
        res.status(500).json({
            message: "Error adding panel to control",
            error: error.message,
        });
    }
}

export async function getPanelsByControlId(req, res) {
    const { id } = req.params;

    try {
        const panels = await models.Panel.findAll({
            where: {
                control_id: id,
            },
        });
        res.status(200).json(panels);
    } catch (error) {
        res.status(500).json({
            message: "Error getting panels by control id",
            error: error.message,
        });
    }
}

export async function deletePanelFromControl(req, res) {
    const { id, panelId } = req.params;

    try {
        await models.Panel.destroy({
            where: {
                control_id: id,
                id: panelId,
            },
        });
        res.status(204).json({
            message: "Panel deleted from control",
        });
    } catch (error) {
        res.status(500).json({
            message: "Error deleting panel from control",
            error: error.message,
        });
    }
}
