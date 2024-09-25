import axios from "axios";
const grafanaUrl = process.env.GRAFANA_URL || "http://localhost:3100";

export async function createGrafanaToken(
    req = null,
    res = null,
    username = null,
    password = null
) {
    if (req && res) {
        username = process.env.GRAFANA_ADMIN_USER;
        password = process.env.GRAFANA_ADMIN_PASS;
    }
    try {
        const randomString = Math.random().toString(36).substring(7);
        const response = await axios.post(
            `${grafanaUrl}/api/auth/keys`,
            {
                name: randomString,
                role: "Admin",
                secondsToLive: 604600,
            },
            {
                auth: {
                    username: username,
                    password: password,
                },
            }
        );
        if (req && res) {
            return res.status(201).json({
                message: "Token created successfully",
                data: response.data,
            });
        }
        return response.data;
    } catch (error) {
        console.error("Error al crear token en Grafana:", error);
        if (error.response) {
            const { status, statusText, data } = error.response;
            if (req && res) {
                return res.status(status).json({
                    message: `Failed to create token in Grafana: ${statusText}`,
                    error: data.message || error.message,
                });
            }
            throw new Error(`Grafana Error ${status}: ${statusText}`);
        } else {
            if (req && res) {
                return res.status(500).json({
                    message:
                        "Failed to create token in Grafana due to server error",
                    error: error.message,
                });
            }
            throw new Error(
                "No se pudo crear el token en Grafana debido a un error del servidor"
            );
        }
    }
}

export async function createGrafanaUser(
    req = null,
    res = null,
    username = null,
    password = null,
    email = null
) {
    if (req && res) {
        const { username, password, email } = req.body;
    }
    try {
        const response = await axios.post(
            `${grafanaUrl}/api/admin/users`,
            {
                name: username,
                email: email,
                login: username,
                password: password,
            },
            {
                auth: {
                    username: process.env.GRAFANA_ADMIN_USER,
                    password: process.env.GRAFANA_ADMIN_PASS,
                },
            }
        );
        if (req && res) {
            return res.status(201).json({
                message: "User created successfully in Grafana",
                data: response.data,
            });
        }
        return response.data;
    } catch (error) {
        if (error.response) {
            const { status, statusText, data } = error.response;
            if (req && res) {
                return res.status(status).json({
                    message: `Failed to create user in Grafana: ${statusText}`,
                    error: data.message || error.message,
                });
            }
            throw new Error(`Grafana Error ${status}: ${statusText}`);
        } else {
            if (req && res) {
                return res.status(500).json({
                    message:
                        "Failed to create user in Grafana due to server error",
                    error: error.message,
                });
            }
            throw new Error(
                "No se pudo crear el usuario en Grafana debido a un error del servidor"
            );
        }
    }
}

export async function getGrafanaUserByUsername(
    req = null,
    res = null,
    username = null
) {
    if (req && res) {
        username = req.query.username || req.params.username;
    }
    try {
        const response = await axios.get(
            `${grafanaUrl}/api/users/lookup?loginOrEmail=${username}`,
            {
                auth: {
                    username: process.env.GRAFANA_ADMIN_USER,
                    password: process.env.GRAFANA_ADMIN_PASS,
                },
            }
        );
        if (req && res) {
            return res.status(200).json({
                message: "User retrieved successfully",
                data: response.data,
            });
        }
        return response.data;
    } catch (error) {
        console.error("Error al obtener usuario en Grafana:", error);

        if (error.response) {
            const { status, statusText, data } = error.response;
            if (req && res) {
                return res.status(status).json({
                    message: `Failed to retrieve user in Grafana: ${statusText}`,
                    error: data.message || error.message,
                });
            }
            throw new Error(`Grafana Error ${status}: ${statusText}`);
        } else {
            if (req && res) {
                return res.status(500).json({
                    message:
                        "Failed to retrieve user in Grafana due to server error",
                    error: error.message,
                });
            }
            throw new Error(
                "No se pudo obtener el usuario en Grafana debido a un error del servidor"
            );
        }
    }
}

export async function deleteGrafanaUserById(req = null, res = null, id = null) {
    if (req && res) {
        id = req.params.id || req.body.id;
    }
    try {
        const response = await axios.delete(
            `${grafanaUrl}/api/admin/users/${id}`,
            {
                auth: {
                    username: process.env.GRAFANA_ADMIN_USER,
                    password: process.env.GRAFANA_ADMIN_PASS,
                },
            }
        );
        if (req && res) {
            return res.status(200).json({
                message: "User deleted successfully",
                data: response.data,
            });
        }
        return response.data;
    } catch (error) {
        console.error("Error al eliminar usuario en Grafana:", error);
        if (error.response) {
            const { status, statusText, data } = error.response;
            if (req && res) {
                return res.status(status).json({
                    message: `Failed to delete user in Grafana: ${statusText}`,
                    error: data.message || error.message,
                });
            }
            throw new Error(`Grafana Error ${status}: ${statusText}`);
        } else {
            if (req && res) {
                return res.status(500).json({
                    message:
                        "Failed to delete user in Grafana due to server error",
                    error: error.message,
                });
            }
            throw new Error(
                "No se pudo eliminar el usuario en Grafana debido a un error del servidor"
            );
        }
    }
}

export async function updateUserPermissions(req = null, res = null, id = null) {
    if (req && res) {
        id = req.params.id || req.body.id;
    }
    try {
        const response = await axios.put(
            `${grafanaUrl}/api/admin/users/${id}/permissions`,
            {
                isGrafanaAdmin: true, // Set to true to grant admin permissions
            },
            {
                auth: {
                    username: process.env.GRAFANA_ADMIN_USER,
                    password: process.env.GRAFANA_ADMIN_PASS,
                },
            }
        );
        if (req && res) {
            return res.status(200).json({
                data: response.data,
            });
        }
        return response.data;
    } catch (error) {
        console.error(
            "Error al actualizar permisos de usuario en Grafana:",
            error
        );
        if (error.response) {
            const { status, statusText, data } = error.response;
            if (req && res) {
                return res.status(status).json({
                    message: `Failed to update user permissions in Grafana: ${statusText}`,
                    error: data.message || error.message,
                });
            }
            throw new Error(`Grafana Error ${status}: ${statusText}`);
        } else {
            if (req && res) {
                return res.status(500).json({
                    message:
                        "Failed to update user permissions in Grafana due to server error",
                    error: error.message,
                });
            }
            throw new Error(
                "No se pudieron actualizar los permisos del usuario en Grafana debido a un error del servidor"
            );
        }
    }
}
export async function createFolder(req, res) {
    try {
        const newUID = [...Array(32)]
            .map(() => Math.random().toString(36)[2])
            .join("");
        const response = await axios.post(
            `${grafanaUrl}/api/folders`,
            {
                uid: newUID,
                title: req.body.title,
                parentUid: req.body.parentUid || null,
            },
            {
                headers: {
                    Authorization: req.headers.authorization,
                },
            }
        );
        return res.status(201).json({
            message: "Folder created successfully",
            data: response.data,
        });
    } catch (error) {
        console.error("Error al crear carpeta en Grafana:", error);
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to create folder in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
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
        const response = await axios.get(
            `${grafanaUrl}/api/folders/${req.params.uid}`,
            {
                headers: {
                    Authorization: req.headers.authorization,
                },
            }
        );
        return res.status(200).json({
            message: "Folder retrieved successfully",
            data: response.data,
        });
    } catch (error) {
        console.error("Error al obtener carpeta en Grafana:", error);
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to retrieve folder in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
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
    const newUID = [...Array(32)]
        .map(() => Math.random().toString(36)[2])
        .join("");
    try {
        const response = await axios.post(
            `${grafanaUrl}/api/dashboards/db`,
            {
                dashboard: {
                    id: null,
                    uid: newUID,
                    title: req.body.title,
                    tags: req.body.tags || [],
                    timezone: "browser",
                    schemaVersion: req.body.schemaVersion || 16,
                    referesh: req.body.refresh || "25s",
                },
                folderUid: req.body.folderUid,
                message: req.body.message,
                overwrite: false,
            },
            {
                headers: {
                    Authorization: req.headers.authorization,
                },
            }
        );
        return res.status(201).json({
            message: "Dashboard created successfully",
            data: response.data,
        });
    } catch (error) {
        console.error("Error al crear dashboard en Grafana:", error);
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to create dashboard in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
        } else {
            return res.status(500).json({
                message:
                    "Failed to create dashboard in Grafana due to server error",
                error: error.message,
            });
        }
    }
}

export async function getDashboardByUID(req, res) {
    try {
        const response = await axios.get(
            `${grafanaUrl}/api/dashboards/uid/${req.params.uid}`,
            {
                headers: {
                    Authorization: req.headers.authorization,
                },
            }
        );
        return res.status(200).json({
            message: "Dashboard retrieved successfully",
            data: response.data,
        });
    } catch (error) {
        console.error("Error al obtener dashboard en Grafana:", error);
        if (error.response) {
            const { status, statusText, data } = error.response;
            return res.status(status).json({
                message: `Failed to retrieve dashboard in Grafana: ${statusText}`,
                error: data.message || error.message,
            });
        } else {
            return res.status(500).json({
                message:
                    "Failed to retrieve dashboard in Grafana due to server error",
                error: error.message,
            });
        }
    }
}
