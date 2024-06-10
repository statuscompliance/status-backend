import models from "../../db/models.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

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
                {
                    refresh_token: refreshToken,
                },
                {
                    where: {
                        username,
                    },
                }
            );
            res.status(200).json({
                username: username,
                accessToken: accessToken,
                refreshToken: refreshToken,
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
    const accessToken =
        req.headers["authorization"].split(" ")[1] ||
        req.headers["Authorization"].split(" ")[1];
    const decoded = jwt.verify(accessToken, process.env.JWT_SECRET);
    const authority = decoded.authority;
    res.status(200).json({ authority: authority });
}
