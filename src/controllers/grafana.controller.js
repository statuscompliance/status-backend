import axios from "axios";
const grafanaUrl = process.env.GRAFANA_URL || "http://localhost:3100";

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
