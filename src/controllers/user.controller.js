import models from "../../db/models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import axios from "axios";

export async function signUp(req, res) {
    const { username, password, email } = req.body;
    const rows = await models.User.findAll({
        where: {
            username,
        },
    });

    if (rows.length > 0) {
        return res.status(400).json({ message: "Username already exists" });
    }
    const authority = "ADMIN";
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        await models.User.create({
            username,
            password: hashedPassword,
            authority,
            email,
        });
        res.status(201).json({
            message: `User ${username} created successfully with authority ${authority}`,
        });
    } catch (error) {
        res.status(500).json({
            message: `Failed to create user, error: ${error.message}`,
        });
    }
}

function isValidNodeRedUrl(nodeRedUrl) {
    const urlPattern = /^(http:\/\/|https:\/\/)[a-zA-Z0-9.-]+(:\d+)?$/;
    return urlPattern.test(nodeRedUrl);
}

async function getNodeRedToken(username, password) {
    const nodeRedUrl = process.env.NODE_RED_URL;

    if (!isValidNodeRedUrl(nodeRedUrl)) {
        throw new Error("Invalid Node-RED URL");
    }
    try {
        const response = await axios.post(`${nodeRedUrl}/auth/token`, {
            client_id: "node-red-admin",
            grant_type: "password",
            scope: "*",
            username: username,
            password: password,
        });
        return response.data.access_token;
    } catch (error) {
        console.error("Error al obtener token de Node-RED:", error);
        throw new Error("No se pudo obtener el token de Node-RED");
    }
}

export async function signIn(req, res) {
    const { username, password } = req.body;
    try {
        const user = await models.User.findOne({
            where: {
                username,
            },
        });

        if (!user || user.length === 0) {
            return res.status(404).json({ message: "User not found" });
        }

        const hashedPassword = user.password;
        const isPasswordValid = await bcrypt.compare(password, hashedPassword);

        if (!isPasswordValid) {
            return res.status(401).json({ message: "Invalid password" });
        } else {
            const accessToken = jwt.sign(
                {
                    user_id: user.id,
                    username: user.username,
                    authority: user.authority,
                },
                process.env.JWT_SECRET,
                { expiresIn: "1h" }
            );
            const refreshToken = jwt.sign(
                {
                    user_id: user.id,
                    username: user.username,
                    authority: user.authority,
                },
                process.env.REFRESH_JWT_SECRET,
                { expiresIn: "1d" }
            );

            await models.User.update(
                { refresh_token: refreshToken },
                { where: { username } }
            );

            const nodeRedToken = await getNodeRedToken(username, password);

            res.status(200).json({
                username: username,
                accessToken: accessToken,
                refreshToken: refreshToken,
                nodeRedToken: nodeRedToken,
            });
        }
    } catch (error) {
        console.error("Error during sign-in:", error);
        res.status(500).json({ message: "Internal server error" });
    }
}

export async function signOut(req, res) {
    const cookies = req.cookies;
    if (!cookies?.refreshToken) {
        return res.sendStatus(204);
    }
    const refreshToken = cookies.refreshToken;
    const user = await models.User.findAll({
        where: {
            refresh_token: refreshToken,
        },
    });
    if (user.length === 0) {
        res.clearCookie("refreshToken", {
            httpOnly: true,
            secure: true,
            sameSite: "none",
            maxAge: 24 * 60 * 60 * 1000,
        });
        return res.sendStatus(204);
    }
    await models.User.update(
        {
            refresh_token: "",
        },
        {
            where: {
                refresh_token: refreshToken,
            },
        }
    );
    res.clearCookie("refreshToken", {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000,
    });
    res.sendStatus(204);
}

export async function getUsers(req, res) {
    // THIS IS A TEST FUNCTION
    const rows = await models.User.findAll();
    res.status(200).json(rows);
}

export async function getAuthority(req, res) {
    const auth =
        req.headers?.["authorization"] ?? req.headers?.["Authorization"];
    const accessToken = auth?.split(" ")?.[1];

    try {
        if (!auth || !accessToken) {
            throw new Error();
        } else {
            const { authority } = jwt.verify(
                accessToken,
                process.env.JWT_SECRET
            );
            res.status(200).json({ authority });
        }
    } catch {
        return res
            .status(401)
            .json({ message: "No token provided or it's malformed" });
    }
}

export async function deleteUserById(req, res) {
    const { id } = req.params;
    try {
        const user = await models.User.findByPk(id);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        const actualGrafanaUser = await (null, null, user.username);
        // await deleteGrafanaUserById(null, null, actualGrafanaUser.id);
        // await user.destroy();
        return res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        console.error("Error during delete user:", error);
        return res.status(500).json({ message: "Internal server error" });
    }
}
