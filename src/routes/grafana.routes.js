import { Router } from "express";

import {
    createGrafanaToken,
    createGrafanaUser,
    getGrafanaUserByUsername,
    deleteGrafanaUserById,
    updateUserPermissions,
    createFolder,
    getFolderByUID,
    createDashboard,
    getDashboardByUID,
} from "../controllers/grafana.controller.js";

const router = Router();
router.post("/grafana/user", createGrafanaUser);
router.get("/grafana/user/:username", getGrafanaUserByUsername);
router.put("/grafana/user/:id/permissions", updateUserPermissions);
router.delete("/grafana/user/:id", deleteGrafanaUserById);
router.post("/grafana/auth/token", createGrafanaToken);
router.post("/grafana/folder", createFolder);
router.get("/grafana/folder/:uid", getFolderByUID);
router.post("/grafana/dashboard", createDashboard);
router.get("/grafana/dashboard/:uid", getDashboardByUID);

export default router;

/**
 * @swagger
 * /api/grafana/user:
 *   post:
 *     summary: Creates a new Grafana user account
 *     tags:
 *       - Grafana
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully in Grafana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Failed to create user in Grafana
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/grafana/user/{username}:
 *   get:
 *     summary: Retrieves a Grafana user by username
 *     tags:
 *       - Grafana
 *     parameters:
 *       - in: path
 *         name: username
 *         required: true
 *         schema:
 *           type: string
 *         description: The username of the Grafana user to retrieve
 *     responses:
 *       200:
 *         description: User retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       404:
 *        description: User not found
 *        content:
 *          application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to retrieve Grafana user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /api/grafana/user/{id}:
 *   delete:
 *     summary: Deletes a Grafana user by ID
 *     tags:
 *       - Grafana
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the Grafana user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *       500:
 *         description: Failed to delete Grafana user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */
