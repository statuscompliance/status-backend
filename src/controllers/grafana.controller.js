import axios from "axios";
import { methods } from "../grafana.js";

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

export async function createDashboard(req, res) {
    try {
        const response = await methods.dashboard.postDashboard(
            req.body
            // dashboard: {
            //     id: null,
            //     uid: crypto.randomUUID(),
            //     title: req.body.dashboard.title,
            //     tags: req.body.dashboard.tags || [],
            //     timezone: "browser",
            //     schemaVersion: req.body.dashboard.schemaVersion || 16,
            //     refresh: req.body.dashboard.refresh || "25s",
            // },
            // folderUid: req.body.folderUid,
            // message: req.body.message,
            // overwrite: req.body.overwrite || false,
        );
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
