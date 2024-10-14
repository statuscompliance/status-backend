import { methods } from "../grafana.js";
import createPanelTemplate from "../utils/panelStructures.js";
import { createSQLQuery, parseSQLQuery } from "../utils/sqlQueryBuilder.js";

export async function createServiceAccount(req, res) {
    try {
        const { name, role } = req.body;
        const serviceAccountData = {
            isDisabled: false,
            name: name,
            role: role,
        };

        const response = await methods.serviceAccount.createServiceAccount(
            serviceAccountData
        );

        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to create service account in Grafana due to server error",
                error: error.message,
            });
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
            const errorData = error.response.data ? error.response.data : error;
            return res.status(status).json(errorData);
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

export async function createDashboard(req, res) {
    try {
        const response = await methods.dashboard.postDashboard({
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
            message: "Dashboard created successfully",
        });
        return res.status(201).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status } = error.response;
            return res.status(status).json(error);
        } else {
            return res.status(500).json({
                message:
                    "Failed to create dashboard in Grafana due to server error",
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

export async function parseQuery(req, res) {
    try {
        const response = parseSQLQuery(req.body.rawSql);
        return res.status(200).json({
            message: "SQL query parsed successfully",
            sql: response,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to parse SQL query",
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
        if (!newPanel) {
            return res.status(400).json({
                message: `Unsupported panel type: ${type}`,
            });
        }

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

        return res.status(201).json({
            panelId: newPanelId,
            title: newPanel.title,
            type: newPanel.type,
            rawSql: newPanel.targets[0].rawSql,
            displayName: newPanel.fieldConfig.defaults.displayName,
            gridPos: newPanel.gridPos,
            ...response.data,
        });
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

export async function getDashboardPanelQueriesByUID(req, res) {
    try {
        const response = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );
        if (response.data.dashboard.panels.length > 0) {
            const panelQueries = response.data.dashboard.panels.map((panel) => {
                return {
                    id: panel.id,
                    title: panel.title,
                    displayName: panel.fieldConfig.defaults.displayName,
                    rawSql: panel.targets[0].rawSql,
                    type: panel.type,
                };
            });
            return res.status(200).json(panelQueries);
        }
        return res.status(404).json({
            message: "No panels found in dashboard",
        });
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

export async function getPanelQueryByID(req, res) {
    try {
        const response = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );
        if (response.data.dashboard.panels.length > 0) {
            const panel = response.data.dashboard.panels.find(
                (panel) => panel.id === parseInt(req.params.id, 10)
            );
            return res.status(200).json({
                id: panel.id,
                title: panel.title,
                type: panel.type,
                rawSql: panel.targets[0].rawSql,
                displayName: panel.fieldConfig.defaults.displayName,
                gridPos: panel.gridPos,
            });
        }
        return res.status(404).json({
            message: "Panel not found in dashboard",
        });
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

export async function getPanelsByDashboardUID(req, res) {
    try {
        const response = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );
        if (response.data.dashboard.panels.length > 0) {
            const panels = response.data.dashboard.panels.map((panel) => {
                return {
                    id: panel.id,
                    title: panel.title,
                    type: panel.type,
                    rawSql: panel.targets[0].rawSql,
                    displayName: panel.fieldConfig.defaults.displayName,
                    gridPos: panel.gridPos,
                };
            });
            return res.status(200).json(panels);
        }
        return res.status(404).json({
            message: "No panels found in dashboard",
        });
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

export async function deleteDashboardByUID(req, res) {
    try {
        const response = await methods.dashboard.deleteDashboardByUID(
            req.params.uid
        );
        return res.status(200).json(response.data);
    } catch (error) {
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to delete dashboard in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
        } else {
            return res.status(500).json({
                message:
                    "Failed to delete dashboard in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function deletePanelByID(req, res) {
    try {
        const response = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );
        if (response.data.dashboard.panels.length > 0) {
            const panelIndex = response.data.dashboard.panels.findIndex(
                (panel) => panel.id === parseInt(req.params.id, 10)
            );
            if (panelIndex >= 0) {
                response.data.dashboard.panels.splice(panelIndex, 1);
                response.data.dashboard.version += 1;
                const deleteResponse = await methods.dashboard.postDashboard({
                    dashboard: response.data.dashboard,
                    folderUid: response.data.meta.folderUid,
                    overwrite: true,
                });
                return res.status(200).json(deleteResponse.data);
            }
            return res.status(404).json({
                message: "Panel not found in dashboard",
            });
        }
        return res.status(404).json({
            message: "No panels found in dashboard",
        });
    } catch (error) {
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to delete panel in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
        } else {
            return res.status(500).json({
                message:
                    "Failed to delete panel in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function updatePanelByID(req, res) {
    try {
        const response = await methods.dashboard.getDashboardByUID(
            req.params.uid
        );
        const {
            title,
            type,
            sqlQuery,
            table,
            displayName,
            gridPos = { x: 0, y: 0, w: 12, h: 8 },
        } = req.body;

        if (response.data.dashboard.panels.length > 0) {
            const panelIndex = response.data.dashboard.panels.findIndex(
                (panel) => panel.id === parseInt(req.params.id, 10)
            );
            if (panelIndex >= 0) {
                const panel = response.data.dashboard.panels[panelIndex];
                const updatedPanel =
                    type === undefined
                        ? createPanelTemplate(panel.type)
                        : createPanelTemplate(type);
                updatedPanel.id = parseInt(req.params.id, 10);
                updatedPanel.title = title === undefined ? panel.title : title;
                updatedPanel.fieldConfig.defaults.displayName =
                    displayName === undefined
                        ? panel.fieldConfig.defaults.displayName
                        : displayName;
                updatedPanel.gridPos =
                    gridPos === undefined ? panel.gridPos : gridPos;
                if (updatedPanel.targets && updatedPanel.targets.length > 0) {
                    updatedPanel.targets[0].rawSql =
                        sqlQuery === undefined
                            ? panel.targets[0].rawSql
                            : createSQLQuery(sqlQuery);
                    updatedPanel.targets[0].table =
                        table === undefined ? panel.targets[0].table : table;
                }
                response.data.dashboard.panels[panelIndex] = updatedPanel;
                response.data.dashboard.version += 1;
                const updateResponse = await methods.dashboard.postDashboard({
                    dashboard: response.data.dashboard,
                    folderUid: response.data.meta.folderUid,
                    overwrite: true,
                });
                return res.status(200).json(updateResponse.data);
            }
            return res.status(404).json({
                message: "Panel not found in dashboard",
            });
        }
        return res.status(404).json({
            message: "No panels found in dashboard",
        });
    } catch (error) {
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to update panel in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
        } else {
            return res.status(500).json({
                message:
                    "Failed to update panel in Grafana due to server error",
                error: error.message,
            });
        }
    }
}
