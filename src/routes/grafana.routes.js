import { Router } from "express";

import {
    createFolder,
    getFolderByUID,
    getDashboardByUID,
    addDatasource,
    createServiceAccount,
    getServiceAccountById,
    createServiceAccountToken,
    getDatasources,
    importDashboard,
    addDashboardPanel,
} from "../controllers/grafana.controller.js";

const router = Router();

//SERVICE ACCOUNT
router.post("/grafana/serviceaccount", createServiceAccount);
router.get("/grafana/serviceaccount/:id", getServiceAccountById);
router.post("/grafana/serviceaccount/:id/token", createServiceAccountToken);

//FOLDER
router.post("/grafana/folder", createFolder);
router.get("/grafana/folder/:uid", getFolderByUID);

//DASHBOARD
router.post("/grafana/dashboard/import", importDashboard);
router.post("/grafana/dashboard/:uid/panel", addDashboardPanel);
router.get("/grafana/dashboard/:uid", getDashboardByUID);

//DATASOURCE
router.get("/grafana/datasource", getDatasources);
router.post("/grafana/datasource", addDatasource);

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
