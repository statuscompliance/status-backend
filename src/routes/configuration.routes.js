import { Router } from "express";
import {
    getConfiguration,
    getConfigurationByEndpoint,
    getAssistantLimit,
    updateConfiguration,
    updateAssistantLimit,
} from "../controllers/configuration.controller.js";

const router = Router();

router.get("/config", getConfiguration);
router.get("/config/assistant/limit", getAssistantLimit);
router.post("/config", getConfigurationByEndpoint);
router.put("/config", updateConfiguration);
router.put("/config/assistant/limit/:limit", updateAssistantLimit);

export default router;

/**
 * Retrieves all configurations.
 * @swagger
 * /api/config:
 *   get:
 *     summary: Retrieves all configurations
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Configuration'
 *       500:
 *         description: Failed to get configurations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * Retrieves configuration by endpoint.
 * @swagger
 * /api/config:
 *   post:
 *     summary: Retrieves configuration by endpoint
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: The endpoint of the configuration to retrieve
 *     responses:
 *       200:
 *         description: Configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Configuration'
 *       404:
 *         description: Configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * Updates configuration.
 * @swagger
 * /api/config:
 *   put:
 *     summary: Updates configuration
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               endpoint:
 *                 type: string
 *                 description: The endpoint of the configuration to update
 *               available:
 *                 type: boolean
 *                 description: The availability status of the endpoint
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * Retrieves the assistant limit configuration.
 * @swagger
 * /api/config/assistant/limit:
 *   get:
 *     summary: Retrieves the assistant limit configuration
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Assistant limit configuration retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 limit:
 *                   type: integer
 *                   description: The limit of assistants
 *       404:
 *         description: Configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get assistant limit configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * Updates the assistant limit configuration.
 * @swagger
 * /api/config/assistant/limit/{limit}:
 *   put:
 *     summary: Updates the assistant limit configuration
 *     tags: [Configurations]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: limit
 *         required: true
 *         description: The new limit for assistants
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assistant limit configuration updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Configuration not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update assistant limit configuration
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
