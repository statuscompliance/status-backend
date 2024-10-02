import axios from "axios";
import { methods } from "../grafana.js";
import createPanelTemplate from "../utils/panelStructures.js";
import createSQLQuery from "../utils/sqlQueryBuilder.js";

const grafanaUrl = process.env.GRAFANA_URL || "http://localhost:3100";

export async function createServiceAccount(
    req = null,
    res = null,
    name = null,
    role = null
) {
    try {
        if (req && res) {
            const { name: reqName, role: reqRole } = req.body;
            name = reqName;
            role = reqRole;
        }
        const serviceAccountData = {
            isDisabled: false,
            name: name,
            role: role,
        };

        const response = await methods.serviceAccount.createServiceAccount(
            serviceAccountData
        );
        if (req && res) {
            return res.status(201).json(response.data);
        }
        return response.data;
    } catch (error) {
        if (error.response) {
            const { status, statusText, data } = error.response;
            if (req && res) {
                return res.status(status).json({
                    message: `Failed to create service account in Grafana: ${statusText}`,
                    error: data.message || error.message,
                });
            }
            throw new Error(`Grafana Error ${status}: ${statusText}`);
        } else {
            if (req && res) {
                return res.status(500).json({
                    message:
                        "Failed to create service account in Grafana due to server error",
                    error: error.message,
                });
            }
            throw new Error(
                "No se pudo crear la cuenta de servicio en Grafana debido a un error del servidor"
            );
        }
    }
}

export async function getServiceAccountById(req, res) {
    try {
        const response = await methods.serviceAccount.retrieveServiceAccount(
            req.params.id
        );
        return res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to retrieve service account in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function createServiceAccountToken(req, res) {
    try {
        const tokenData = {
            name: req.body.name,
            secondsToLive: req.body.secondsToLive,
        };
        const response = await methods.serviceAccount.createToken(
            req.params.id,
            tokenData
        );
        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to create service account token in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function createFolder(req, res) {
    try {
        const newUID = crypto.randomUUID();
        const response = await methods.folder.createFolder({
            uid: newUID,
            title: req.body.title,
            parentUid: req.body.parentUid || null,
            description: req.body.description || null,
        });
        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to create folder in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function getFolderByUID(req, res) {
    try {
        const response = await methods.folder.getFolderByUID(req.params.uid);
        return res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to retrieve folder in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function importDashboard(req, res) {
    try {
        const response = await methods.dashboard.importDashboard({
            dashboard: {
                annotations: req.body.dashboard.annotations || {
                    list: [],
                },
                editable: req.body.dashboard.editable || true,
                fiscalYearStartMonth:
                    req.body.dashboard.fiscalYearStartMonth || 0,
                graphTooltip: req.body.dashboard.graphTooltip || 0,
                id: null,
                links: [],
                panels: req.body.dashboard.panels,
                schemaVersion: req.body.dashboard.schemaVersion || 16,
                tags: req.body.dashboard.tags || [],
                templating: req.body.dashboard.templating || {
                    list: [],
                },
                time: req.body.dashboard.time || {
                    from: "now-6h",
                    to: "now",
                },
                timepicker: req.body.dashboard.timepicker || {},
                timezone: req.body.dashboard.timezone || "browser",
                title: req.body.dashboard.title,
                version: req.body.dashboard.version || 0,
                weekStart: req.body.dashboard.weekStart || "",
            },
            overwrite: req.body.overwrite || true,
            inputs: req.body.inputs || [],
            folderUid: req.body.folderUid,
        });
        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to import dashboard in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function createQuery(req, res) {
    try {
        const response = createSQLQuery(req.body);
        return res.status(200).json({
            message: "SQL query created successfully",
            query: response,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create SQL query",
            error: error.message,
        });
    }
}

export async function addDashboardPanel(req, res) {
    try {
        const {
            title,
            type,
            sqlQuery,
            table = "Computations",
            displayName,
            gridPos = { x: 0, y: 0, w: 12, h: 8 },
        } = req.body;

        const dashboardResponse = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );

        const dashboardMetadata = dashboardResponse.data.meta;
        const actualDashboard = dashboardResponse.data.dashboard;
        let newPanelId = 0;
        if (actualDashboard.panels && actualDashboard.panels.length > 0) {
            newPanelId =
                Math.max(...actualDashboard.panels.map((panel) => panel.id)) +
                1;
            actualDashboard.panels.forEach((panel) => (panel.gridPos.y += 8));
        }
        const newPanel = createPanelTemplate(type);

        newPanel.id = newPanelId;
        newPanel.title = title;
        newPanel.fieldConfig.defaults.displayName = displayName;
        newPanel.gridPos = gridPos;
        if (newPanel.targets && newPanel.targets.length > 0) {
            newPanel.targets[0].rawSql = createSQLQuery(sqlQuery);
            newPanel.targets[0].table = table;
        }

        actualDashboard.panels.push(newPanel);

        actualDashboard.version += 1;
        const response = await methods.dashboard.postDashboard({
            dashboard: actualDashboard,
            message: "Panel added successfully",
            folderUid: dashboardMetadata.folderUid,
            overwrite: true,
        });
        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to import dashboard in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function getDashboardByUID(req, res) {
    try {
        const response = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );
        return res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to retrieve dashboard in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function getDatasources(req, res) {
    try {
        const response = await methods.datasource.getDataSources();
        return res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to retrieve datasources in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function addDatasource(req, res) {
    console.log(req.body);
    try {
        const response = await methods.datasource.addDataSource({
            access: req.body.access,
            basicAuth: req.body.basicAuth,
            basicAuthUser: process.env.GRAFANA_USER,
            database: req.body.database,
            isDefault: req.body.isDefault,
            jsonData: req.body.jsonData,
            name: req.body.datasourceName,
            type: req.body.type,
            uid: crypto.randomUUID(),
            url: req.body.url,
            user: req.body.user,
            withCredentials: true,
        });
        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to create datasource in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
        } else {
            return res.status(500).json({
                message:
                    "Failed to create datasource in Grafana due to server error",
                error: error.message,
            });
        }
    }
}
