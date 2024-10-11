import { Router } from "express";
import axios from "axios";

var client_id = process.env.GH_CLIENT_ID;
var client_secret = process.env.GH_CLIENT_SECRET;

const router = Router();
router.get("/ghAccessToken", async function (req, res) {
    try {
        const code = req.query.code;

        const params = new URLSearchParams({
            client_id: client_id,
            client_secret: client_secret,
            code: code,
            redirect_uri: "http://localhost:3000/profile",
        });

        const GITHUB_OAUTH_URL = "https://github.com/login/oauth/access_token";

        const response = await axios.post(
            `${GITHUB_OAUTH_URL}?${params.toString()}`,
            null,
            { headers: { Accept: "application/json" } }
        );

        if (!response.ok) {
            throw new Error(
                `Error al solicitar el token de acceso a GitHub: ${response.statusText}`
            );
        }

        const data = await response.json();
        res.json(data);
    } catch (error) {
        console.error("Error al obtener el token de acceso de GitHub:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

router.get("/getAuth", async function (req, res) {
    try {
        const authorizationHeader = req.get("Authorization");
        res.json({ authorizationHeader });
    } catch (error) {
        console.error("Error al obtener el encabezado de autorización:", error);
        res.status(500).json({ message: "Error interno del servidor." });
    }
});

export default router;

/**
 * Retrieves GitHub access token using the provided authorization code.
 * @swagger
 * /api/ghAccessToken:
 *   get:
 *     summary: Retrieves GitHub access token
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         description: Authorization code obtained from GitHub OAuth flow
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: GitHub access token retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 access_token:
 *                   type: string
 *                   description: The GitHub access token
 *                 token_type:
 *                   type: string
 *                   description: Type of token
 *       500:
 *         description: Failed to retrieve GitHub access token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */

/**
 * Retrieves authorization header.
 * @swagger
 * /api/getAuth:
 *   get:
 *     summary: Retrieves authorization header
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Authorization header retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authorizationHeader:
 *                   type: string
 *                   description: The authorization header
 *       500:
 *         description: Failed to retrieve authorization header
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
