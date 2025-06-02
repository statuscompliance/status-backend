import { Router } from 'express';
import { 
  getDatasources,
  addDatasource
} from '../controllers/datasource.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grafana Datasources
 *   description: Grafana Datasources management
 */

/**
 * @swagger
 * /grafana/datasource:
 *   get:
 *     summary: Retrieves all data sources from Grafana
 *     tags: [Grafana Datasources]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of data sources
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     example: 1
 *                   name:
 *                     type: string
 *                     example: "My Data Source"
 *                   type:
 *                     type: string
 *                     example: "postgres"
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
 *         description: Forbidden - User does not have permission to access this resource
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
 *                   example: "You do not have permission to access this resource."
 *       500:
 *         description: Failed to retrieve data sources in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve datasources in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.get('/datasource', getDatasources);

/**
 * @swagger
 * /grafana/datasource:
 *   post:
 *     summary: Adds a new data source to Grafana
 *     tags: [Grafana Datasources]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               access:
 *                 type: string
 *                 example: "proxy"
 *               basicAuth:
 *                 type: boolean
 *                 example: true
 *               database:
 *                 type: string
 *                 example: "my_database"
 *               isDefault:
 *                 type: boolean
 *                 example: false
 *               jsonData:
 *                 type: object
 *               datasourceName:
 *                 type: string
 *                 example: "My New Data Source"
 *               type:
 *                 type: string
 *                 example: "postgres"
 *               url:
 *                 type: string
 *                 example: "http://localhost:5432"
 *               user:
 *                 type: string
 *                 example: "admin"
 *     responses:
 *       201:
 *         description: Data source created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 2
 *                 name:
 *                   type: string
 *                   example: "My New Data Source"
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
 *         description: Forbidden - User does not have permission to access this resource
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
 *                   example: "You do not have permission to access this resource."
 *       409:
 *         description: Conflict - Data source with the same name already exists
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
 *                   example: "Datasource with the same name already exists."
 *       500:
 *         description: Failed to create datasource in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to create datasource in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.post('/datasource', addDatasource);

export default router;
