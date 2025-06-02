import { Router } from 'express';
import { 
  createServiceAccount,
  getServiceAccountById,
  createServiceAccountToken
} from '../controllers/serviceAccount.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grafana Authentication
 *   description: Grafana Authentication management
 */

/**
 * @swagger
 * /grafana/serviceaccount:
 *   post:
 *     summary: Creates a new service account in Grafana
 *     tags: [Grafana Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the service account
 *                 example: "example-service-account"
 *               role:
 *                 type: string
 *                 description: Role assigned to the service account
 *                 example: "Admin"
 *     responses:
 *       201:
 *         description: Service account created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isDisabled:
 *                   type: boolean
 *                   description: Status of the service account
 *                   example: false
 *                 name:
 *                   type: string
 *                   description: Name of the service account
 *                   example: "example-service-account"
 *                 role:
 *                   type: string
 *                   description: Role assigned to the service account
 *                   example: "Admin"
 *       400:
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid request data"
 *                 error:
 *                   type: string
 *                   example: "The 'name' field is required."
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *                 error:
 *                   type: string
 *                   example: "Invalid authentication token."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden"
 *                 error:
 *                   type: string
 *                   example: "You do not have permission to create a service account."
 *       500:
 *         description: Failed to create service account in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to create service account in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Internal Server Error"
 */
router.post('/serviceaccount', createServiceAccount);

/**
 * @swagger
 * /grafana/serviceaccount/{id}:
 *   get:
 *     summary: Retrieves a service account by ID from Grafana
 *     tags: [Grafana Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the service account to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Service account retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 isDisabled:
 *                   type: boolean
 *                   description: Status of the service account
 *                   example: false
 *                 name:
 *                   type: string
 *                   description: Name of the service account
 *                   example: "example-service-account"
 *                 role:
 *                   type: string
 *                   description: Role assigned to the service account
 *                   example: "Admin"
 *       400:
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid request data"
 *                 error:
 *                   type: string
 *                   example: "The 'id' parameter must be a valid UUID."
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *                 error:
 *                   type: string
 *                   example: "Invalid authentication token."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden"
 *                 error:
 *                   type: string
 *                   example: "You do not have permission to view this service account."
 *       404:
 *         description: Not Found - Service account with the specified ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Service account not found."
 *                 error:
 *                   type: string
 *                   example: "No service account found with ID: 123."
 *       500:
 *         description: Failed to retrieve service account in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to retrieve service account in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Internal Server Error"
 */
router.get('/serviceaccount/:id', getServiceAccountById);

/**
 * @swagger
 * /grafana/serviceaccount/{id}/token:
 *   post:
 *     summary: Creates a new token for the specified service account in Grafana
 *     tags: [Grafana Authentication]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: ID of the service account for which to create a token
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the token
 *                 example: "example-token"
 *               secondsToLive:
 *                 type: integer
 *                 description: Duration in seconds before the token expires
 *                 example: 3600
 *     responses:
 *       201:
 *         description: Token created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The created token
 *                   example: "eyJhbGciOiJIUzI1NiIsInR..."
 *       400:
 *         description: Bad Request - Invalid input data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Invalid request data"
 *                 error:
 *                   type: string
 *                   example: "The 'name' field is required."
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unauthorized"
 *                 error:
 *                   type: string
 *                   example: "Invalid authentication token."
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Forbidden"
 *                 error:
 *                   type: string
 *                   example: "You do not have permission to create a token for this service account."
 *       404:
 *         description: Not Found - Service account with the specified ID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Service account not found."
 *                 error:
 *                   type: string
 *                   example: "No service account found with ID: 123."
 *       409:
 *         description: Conflict - Token could not be created due to a conflict
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Conflict"
 *                 error:
 *                   type: string
 *                   example: "A token already exists for this service account."
 *       500:
 *         description: Failed to create service account token in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to create service account token in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Internal Server Error"
 */
router.post('/serviceaccount/:id/token', createServiceAccountToken);

export default router;
