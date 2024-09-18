import models from "../../db/models.js";

export async function getDashboards(req, res) {
    try {
        const dashboards = await models.Dashboard.findAll();
        res.status(200).json(dashboards);
    } catch (error) {
        res.status(500).json({
            message: `Failed to get dashboards, error: ${error.message}`,
        });
    }
}

export async function getDashboardById(req, res) {
    try {
        const { id } = req.params;
        const dashboard = await models.Dashboard.findByPk(id);
        res.status(200).json(dashboard);
    } catch (error) {
        res.status(500).json({
            message: `Failed to get dashboards, error: ${error.message}`,
        });
    }
}

export async function getDashboardResults(req, res) {
    try {
        const { id } = req.params;
        const { status } = req.query;
        const dashboardResults = await models.Dashboard.findByPk(id, {
            attributes: ["results"],
        });

        if (!dashboardResults) {
            return res.status(404).json({
                message: `Dashboard with id ${id} not found`,
            });
        }

        if (status === "true" || status === "false") {
            const results = dashboardResults.results.filter(
                (element) => element.result.toString() === status
            );
            return res.status(200).json(results);
        } else {
            return res.status(200).json(dashboardResults.results);
        }
    } catch (error) {
        res.status(500).json({
            message: `Failed to get dashboard results, error: ${error.message}`,
        });
    }
}

export async function createDashboard(req, res) {
    try {
        const dashboard = req.body;
        const newDashboard = await models.Dashboard.create(dashboard);
        res.status(201).json(newDashboard);
    } catch (error) {
        res.status(500).json({
            message: `Failed to create dashboard, error: ${error.message}`,
        });
    }
}

export async function deleteDashboard(req, res) {
    try {
        const { id } = req.params;
        await models.Dashboard.destroy({
            where: {
                id: id,
            },
        });
        res.status(200).json({
            message: `Dashboard with id ${id} deleted successfully`,
        });
    } catch (error) {
        res.status(500).json({
            message: `Failed to delete dashboard, error: ${error.message}`,
        });
    }
}

export async function updateDashboard(req, res) {
    try {
        const { id } = req.params;
        const dashboard = req.body;
        await models.Dashboard.update(dashboard, {
            where: {
                id: id,
            },
        });
        res.status(200).json({
            message: `Dashboard with id ${id} updated successfully`,
        });
    } catch (error) {
        res.status(500).json({
            message: `Failed to update dashboard, error: ${error.message}`,
        });
    }
}
