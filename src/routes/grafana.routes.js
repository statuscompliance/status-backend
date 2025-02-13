import { Router } from 'express';
import { validateUUID, checkIdParam } from '../middleware/validation.js';
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
  createDashboard,
  addDashboardPanel,
  createQuery,
  parseQuery,
  getPanelQueryByID,
  getDashboardPanelQueriesByUID,
  deleteDashboardByUID,
  deletePanelByID,
  updatePanelByID,
  getPanelsByDashboardUID,
  getFolders,
  getFolderDashboardsByUID,
} from '../controllers/grafana.controller.js';

const router = Router();

//SERVICE ACCOUNT
router.post('/serviceaccount', createServiceAccount);
router.get('/serviceaccount/:id', getServiceAccountById);
router.post('/serviceaccount/:id/token', createServiceAccountToken);

//FOLDER
router.get('/folder', getFolders);
router.post('/folder', createFolder);
router.get('/folder/:uid', validateUUID('uid'), getFolderByUID);
router.get('/folder/:uid/dashboard', getFolderDashboardsByUID);

//DASHBOARD
router.post('/dashboard', createDashboard);
router.post('/dashboard/import', importDashboard);
router.get('/dashboard/:uid', validateUUID('uid'), getDashboardByUID);
router.delete('/dashboard/:uid', validateUUID('uid'), deleteDashboardByUID);
router.get('/dashboard/:uid/panel', validateUUID('uid'), getPanelsByDashboardUID);
router.post('/dashboard/:uid/panel', validateUUID('uid'), addDashboardPanel);
router.patch('/dashboard/:uid/panel/:id', validateUUID('uid'), checkIdParam, updatePanelByID);
router.delete('/dashboard/:uid/panel/:id', validateUUID('uid'), checkIdParam, deletePanelByID);
router.get(
  '/dashboard/:uid/panel/query',
  validateUUID('uid'), 
  checkIdParam, 
  getDashboardPanelQueriesByUID
);
router.get('/dashboard/:uid/panel/:id/query', validateUUID('uid'), checkIdParam, getPanelQueryByID);

//DATASOURCE
router.get('/datasource', getDatasources);
router.post('/datasource', addDatasource);

//ENDPOINT FOR TESTING SQL QUERY BUILDER
router.post('/sql/parse', parseQuery);
router.post('/sql/build', createQuery);

export default router;

/**
 * @swagger
 * tags:
 *   name: Grafana Authentication
 *   description: Grafana Authentication management
 */

/**
 * @swagger
 * tags:
 *   name: Grafana Dashboards
 *   description: Grafana Dashboards management
 */

/**
 * @swagger
 * tags:
 *   name: Grafana Folders
 *   description: Grafana Folders management
 */

/**
 * @swagger
 * tags:
 *   name: Grafana Datasources
 *   description: Grafana Datasources management
 */

/**
 * @swagger
 * tags:
 *   name: Grafana Queries
 *   description: Grafana SQL Query builder and parser
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

/**
 * @swagger
 * /grafana/folder:
 *   get:
 *     summary: Retrieves all folders from Grafana
 *     tags: [Grafana Folders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Folders retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID of the folder
 *                   uid:
 *                     type: string
 *                     description: UID of the folder
 *                   title:
 *                     type: string
 *                     description: Title of the folder
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UnauthorizedError"
 *                 message:
 *                   type: string
 *                   example: "Request is not authenticated."
 *                 status:
 *                   type: string
 *                   example: "401"
 *       403:
 *         description: Forbidden - Insufficient permissions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "ForbiddenError"
 *                 message:
 *                   type: string
 *                   example: "Insufficient permissions."
 *                 status:
 *                   type: string
 *                   example: "403"
 *       500:
 *         description: Internal Server Error - Failed to retrieve folders
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "InternalServerError"
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve folders in Grafana due to server error."
 *   post:
 *     summary: Creates a new folder in Grafana
 *     tags: [Grafana Folders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the new folder
 *                 example: "New Folder"
 *               parentUid:
 *                 type: string
 *                 description: UID of the parent folder (optional)
 *                 example: "1234"
 *               description:
 *                 type: string
 *                 description: Description of the new folder (optional)
 *                 example: "This is a description of the new folder."
 *     responses:
 *       201:
 *         description: Folder created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   description: UID of the newly created folder
 *                   example: "5678"
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
 *                   example: "The 'title' field is required."
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
 *                   example: "You do not have permission to create a folder."
 *       409:
 *         description: Conflict - Folder could not be created due to a conflict
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
 *                   example: "A folder with the same title already exists."
 *       500:
 *         description: Failed to create folder in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to create folder in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/folder/{uid}:
 *   get:
 *     summary: Retrieves a folder by UID from Grafana
 *     tags: [Grafana Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         description: UID of the folder to retrieve
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 uid:
 *                   type: string
 *                   description: UID of the folder
 *                   example: "5678"
 *                 title:
 *                   type: string
 *                   description: Title of the folder
 *                   example: "New Folder"
 *                 description:
 *                   type: string
 *                   description: Description of the folder
 *                   example: "This is a description of the folder."
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
 *                   example: "You do not have permission to access this folder."
 *       404:
 *         description: Not Found - Folder with the specified UID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Folder not found."
 *                 error:
 *                   type: string
 *                   example: "No folder found with UID: 5678."
 *       500:
 *         description: Failed to retrieve folder in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to retrieve folder in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/folder/{uid}/dashboard:
 *   get:
 *     summary: Retrieves dashboards for a specific folder by UID
 *     tags: [Grafana Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         schema:
 *           type: string
 *         description: UID of the folder to retrieve dashboards from
 *     responses:
 *       200:
 *         description: Dashboards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: ID of the dashboard
 *                   uid:
 *                     type: string
 *                     description: UID of the dashboard
 *                   title:
 *                     type: string
 *                     description: Title of the dashboard
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UnauthorizedError"
 *                 message:
 *                   type: string
 *                   example: "Request is not authenticated."
 *                 status:
 *                   type: string
 *                   example: "401"
 *       422:
 *         description: Unprocessable Entity - Invalid folder UID provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "UnprocessableEntityError"
 *                 message:
 *                   type: string
 *                   example: "Invalid UID for folder."
 *                 status:
 *                   type: string
 *                   example: "422"
 *       500:
 *         description: Internal Server Error - Failed to retrieve dashboards
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "InternalServerError"
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve dashboards in Grafana due to server error."
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

/**
 * @swagger
 * /grafana/sql/build:
 *   post:
 *     summary: Creates a SQL query based on provided parameters
 *     tags: [Grafana Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               aggregations:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     func:
 *                       type: string
 *                       example: "COUNT"
 *                     attr:
 *                       type: string
 *                       example: "id"
 *               columns:
 *                 type: array
 *                 items:
 *                   type: string
 *                   example: "name"
 *               whereConditions:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     key:
 *                       type: string
 *                       example: "status"
 *                     operator:
 *                       type: string
 *                       example: "="
 *                     value:
 *                       type: string
 *                       example: "active"
 *               whereLogic:
 *                 type: string
 *                 example: "AND"
 *               groupBy:
 *                 type: string
 *                 example: "category"
 *               orderByAttr:
 *                 type: string
 *                 example: "created_at"
 *               orderDirection:
 *                 type: string
 *                 example: "ASC"
 *               table:
 *                 type: string
 *                 example: "Computations"
 *     responses:
 *       200:
 *         description: SQL query created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SQL query created successfully"
 *                 query:
 *                   type: string
 *                   example: "SELECT COUNT(id) FROM Computations WHERE status = 'active'"
 *       500:
 *         description: Failed to create SQL query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to create SQL query"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/sql/parse:
 *   post:
 *     summary: Parses a SQL query into JSON parameters
 *     tags: [Grafana Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rawSql:
 *                 type: string
 *                 example: "SELECT COUNT(id) FROM Computations WHERE status = 'active' GROUP BY category ORDER BY created_at DESC"
 *     responses:
 *       200:
 *         description: SQL query parsed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "SQL query parsed successfully"
 *                 parsedQuery:
 *                   type: object
 *                   properties:
 *                     aggregations:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           func:
 *                             type: string
 *                             example: "COUNT"
 *                           attr:
 *                             type: string
 *                             example: "id"
 *                     columns:
 *                       type: array
 *                       items:
 *                         type: string
 *                         example: "name"
 *                     whereConditions:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           key:
 *                             type: string
 *                             example: "status"
 *                           operator:
 *                             type: string
 *                             example: "="
 *                           value:
 *                             type: string
 *                             example: "active"
 *                     whereLogic:
 *                       type: string
 *                       example: "AND"
 *                     groupBy:
 *                       type: string
 *                       example: "category"
 *                     orderByAttr:
 *                       type: string
 *                       example: "created_at"
 *                     orderDirection:
 *                       type: string
 *                       example: "DESC"
 *                     table:
 *                       type: string
 *                       example: "Computations"
 *       500:
 *         description: Failed to parse SQL query
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to parse SQL query"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}:
 *   get:
 *     summary: Retrieves the specified dashboard by UID
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         description: UID of the dashboard to retrieve
 *         schema:
 *           type: string
 *           example: "abc123"
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 meta:
 *                   type: object
 *                   description: Metadata about the dashboard
 *                 dashboard:
 *                   type: object
 *                   description: The dashboard object
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
 *       404:
 *         description: Not Found - Dashboard with the specified UID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not Found"
 *                 error:
 *                   type: string
 *                   example: "Dashboard not found."
 *       500:
 *         description: Failed to retrieve dashboard in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}:
 *   delete:
 *     summary: Deletes a specific Grafana Dashboard by UID
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the Grafana Dashboard
 *         example: "lLXkvvVGk"
 *     responses:
 *       200:
 *         description: Grafana Dashboard deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dashboard deleted successfully"
 *       404:
 *         description: Grafana Dashboard not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Dashboard not found"
 *       500:
 *         description: Failed to delete dashboard due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard:
 *   post:
 *     summary: Creates a new Grafana Dashboards
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dashboard:
 *                 type: object
 *                 properties:
 *                   annotations:
 *                     type: object
 *                     properties:
 *                       list:
 *                         type: array
 *                         items:
 *                           type: object
 *                     example:
 *                       list: []
 *                   editable:
 *                     type: boolean
 *                     example: true
 *                   fiscalYearStartMonth:
 *                     type: integer
 *                     example: 0
 *                   graphTooltip:
 *                     type: integer
 *                     example: 0
 *                   panels:
 *                     type: array
 *                     items:
 *                       type: object
 *                     example: []
 *                   schemaVersion:
 *                     type: integer
 *                     example: 27
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: []
 *                   templating:
 *                     type: object
 *                     properties:
 *                       list:
 *                         type: array
 *                         items:
 *                           type: object
 *                     example:
 *                       list: []
 *                   time:
 *                     type: object
 *                     properties:
 *                       from:
 *                         type: string
 *                         example: "now-6h"
 *                       to:
 *                         type: string
 *                         example: "now"
 *                   timepicker:
 *                     type: object
 *                     example:
 *                   timezone:
 *                     type: string
 *                     example: "browser"
 *                   title:
 *                     type: string
 *                     example: "New Dashboard"
 *                   version:
 *                     type: integer
 *                     example: 0
 *                   weekStart:
 *                     type: string
 *                     example: ""
 *               overwrite:
 *                 type: boolean
 *                 example: false
 *               inputs:
 *                 type: array
 *                 items:
 *                   type: object
 *               folderUid:
 *                 type: string
 *                 example:
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               example:
 *                 id: 1
 *                 uid: "nErXDvCkzz"
 *                 url: "/d/nErXDvCkzz/new-dashboard"
 *                 status: "success"
 *       500:
 *         description: Failed to create dashboard due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to create dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/import:
 *   post:
 *     summary: Imports a new dashboard into Grafana
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dashboard:
 *                 type: object
 *                 properties:
 *                   annotations:
 *                     type: object
 *                     properties:
 *                       list:
 *                         type: array
 *                         items:
 *                           type: object
 *                   editable:
 *                     type: boolean
 *                     example: true
 *                   fiscalYearStartMonth:
 *                     type: integer
 *                     example: 0
 *                   graphTooltip:
 *                     type: integer
 *                     example: 0
 *                   panels:
 *                     type: array
 *                     items:
 *                       type: object
 *                       description: Panel configuration
 *                   schemaVersion:
 *                     type: integer
 *                     example: 16
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *                   templating:
 *                     type: object
 *                     properties:
 *                       list:
 *                         type: array
 *                         items:
 *                           type: object
 *                   time:
 *                     type: object
 *                     properties:
 *                       from:
 *                         type: string
 *                         example: "now-6h"
 *                       to:
 *                         type: string
 *                         example: "now"
 *                   timepicker:
 *                     type: object
 *                     description: Timepicker configuration
 *                   timezone:
 *                     type: string
 *                     example: "browser"
 *                   title:
 *                     type: string
 *                     example: "Imported Dashboard"
 *                   version:
 *                     type: integer
 *                     example: 0
 *                   weekStart:
 *                     type: string
 *                     example: ""
 *               overwrite:
 *                 type: boolean
 *                 example: true
 *               inputs:
 *                 type: array
 *                 items:
 *                   type: object
 *               folderUid:
 *                 type: string
 *                 example: "1234"
 *     responses:
 *       201:
 *         description: Dashboard imported successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   description: ID of the imported dashboard
 *                   example: 5678
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
 *                   example: "The 'title' field is required."
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
 *       412:
 *         description: Precondition Failed - The request was not applicable
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Precondition failed"
 *                 error:
 *                   type: string
 *                   example: "Dashboard version is not compatible."
 *       422:
 *         description: Unprocessable Entity - Request data was well-formed but was unable to be followed due to semantic errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Unprocessable Entity"
 *                 error:
 *                   type: string
 *                   example: "Dashboard title already exists."
 *       500:
 *         description: Failed to import dashboard in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *                   example: "Failed to import dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   description: Detailed error message
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}/panel:
 *   post:
 *     summary: Adds a new panel to the specified dashboard
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         description: UID of the dashboard to which the panel will be added
 *         schema:
 *           type: string
 *           example: "abc123"
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: "Add panel testing"
 *               type:
 *                 type: string
 *                 example: "gauge"
 *               displayName:
 *                 type: string
 *                 example: "Test 01"
 *               table:
 *                 type: string
 *                 example: "Configurations"
 *               sqlQuery:
 *                 type: object
 *                 properties:
 *                   aggregations:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         func:
 *                           type: string
 *                           example: "COUNT"
 *                         attr:
 *                           type: string
 *                           example: "id"
 *                   whereConditions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                           example: "id"
 *                         operator:
 *                           type: string
 *                           example: ">"
 *                         value:
 *                           type: integer
 *                           example: 5
 *                   whereLogic:
 *                     type: string
 *                     example: "AND"
 *                   table:
 *                     type: string
 *                     example: "Configurations"
 *     responses:
 *       201:
 *         description: Panel added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Panel added successfully"
 *                 dashboard:
 *                   type: object
 *                   description: The updated dashboard object
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
 *       404:
 *         description: Not Found - Dashboard with the specified UID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Not Found"
 *                 error:
 *                   type: string
 *                   example: "Dashboard not found."
 *       500:
 *         description: Failed to add panel to dashboard in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to import dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}/panel:
 *   get:
 *     summary: Retrieves all panels in a specific Grafana Dashboard
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the Grafana Dashboard
 *         example: "lLXkvvVGk"
 *     responses:
 *       200:
 *         description: Panels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The panel ID within the dashboard
 *                     example: 3
 *                   title:
 *                     type: string
 *                     description: The title of the panel
 *                     example: "CPU Usage"
 *                   type:
 *                     type: string
 *                     description: The type of the panel (e.g., graph, table, etc.)
 *                     example: "graph"
 *                   rawSql:
 *                     type: string
 *                     description: The raw SQL query for the panel
 *                     example: "SELECT * FROM statusdb.Computations"
 *                   displayName:
 *                     type: string
 *                     description: Display name for the data field
 *                     example: "CPU Load"
 *                   gridPos:
 *                     type: object
 *                     description: Position of the panel in the dashboard grid
 *                     properties:
 *                       x:
 *                         type: integer
 *                         example: 0
 *                       y:
 *                         type: integer
 *                         example: 0
 *                       w:
 *                         type: integer
 *                         example: 24
 *                       h:
 *                         type: integer
 *                         example: 9
 *       404:
 *         description: No panels found in dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No panels found in dashboard"
 *       500:
 *         description: Failed to retrieve dashboard due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}/panel/{id}:
 *   patch:
 *     summary: Updates a specific panel in a Grafana Dashboard
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the Grafana Dashboard
 *         example: "lLXkvvVGk"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The panel ID within the dashboard
 *         example: 3
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: The title of the panel
 *                 example: "Updated Panel Title"
 *               type:
 *                 type: string
 *                 description: The type of the panel (e.g., graph, table, etc.)
 *                 example: "gauge"
 *               displayName:
 *                 type: string
 *                 description: Display name for the data field
 *                 example: "New Display Name"
 *               sqlQuery:
 *                 type: object
 *                 description: SQL query details for the panel
 *                 properties:
 *                   aggregations:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         func:
 *                           type: string
 *                           description: Aggregation function
 *                           example: "SUM"
 *                         attr:
 *                           type: string
 *                           description: Attribute to aggregate
 *                           example: "`limit`"
 *                   columns:
 *                     type: array
 *                     description: Columns to select
 *                     example: []
 *                   whereConditions:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         key:
 *                           type: string
 *                           description: Column name for the condition
 *                           example: "id"
 *                         operator:
 *                           type: string
 *                           description: Condition operator
 *                           example: ">"
 *                         value:
 *                           type: string
 *                           description: Condition value
 *                           example: "1"
 *                   whereLogic:
 *                     type: string
 *                     description: Logic for WHERE conditions (e.g., AND, OR)
 *                     example: "AND"
 *                   groupBy:
 *                     type: string
 *                     description: Group by column
 *                     example: null
 *                   orderByAttr:
 *                     type: string
 *                     description: Attribute to order by
 *                     example: null
 *                   orderDirection:
 *                     type: string
 *                     description: Order direction (ASC, DESC)
 *                     example: null
 *                   table:
 *                     type: string
 *                     description: Table to query
 *                     example: "Configurations"
 *               gridPos:
 *                 type: object
 *                 description: Position of the panel in the dashboard grid
 *                 properties:
 *                   x:
 *                     type: integer
 *                     example: 0
 *                   y:
 *                     type: integer
 *                     example: 0
 *                   w:
 *                     type: integer
 *                     example: 12
 *                   h:
 *                     type: integer
 *                     example: 8
 *     responses:
 *       200:
 *         description: Panel updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Panel updated successfully"
 *       404:
 *         description: Panel or dashboard not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Panel not found in dashboard"
 *       500:
 *         description: Failed to update panel due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to update panel in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}/panel/{id}:
 *   delete:
 *     summary: Deletes a specific panel from a Grafana Dashboard
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the Grafana Dashboard
 *         example: "lLXkvvVGk"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The panel ID within the dashboard
 *         example: 3
 *     responses:
 *       200:
 *         description: Panel deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Panel deleted successfully"
 *       404:
 *         description: Panel or dashboard not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Panel not found in dashboard"
 *       500:
 *         description: Failed to delete panel due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete panel in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}/panel/query:
 *   get:
 *     summary: Retrieves queries and metadata of all panels in a Grafana Dashboard
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the Grafana Dashboard
 *         example: "lLXkvvVGk"
 *     responses:
 *       200:
 *         description: Queries and metadata of panels retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                     description: The panel ID within the dashboard
 *                     example: 3
 *                   title:
 *                     type: string
 *                     description: The title of the panel
 *                     example: "CPU Usage"
 *                   displayName:
 *                     type: string
 *                     description: Display name for the data field
 *                     example: "CPU Load"
 *                   rawSql:
 *                     type: string
 *                     description: The raw SQL query used by the panel
 *                     example: "SELECT * FROM server_metrics WHERE status = 'active'"
 *                   type:
 *                     type: string
 *                     description: The type of the panel (e.g., graph, table, etc.)
 *                     example: "graph"
 *       404:
 *         description: No panels found in dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "No panels found in dashboard"
 *       500:
 *         description: Failed to retrieve dashboard due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */

/**
 * @swagger
 * /grafana/dashboard/{uid}/panel/{id}/query:
 *   get:
 *     summary: Retrieves the raw SQL query of a specific panel in a Grafana Dashboards
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: The unique identifier of the Grafana Dashboards
 *         example: "lLXkvvVGk"
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The panel ID within the dashboard
 *         example: 3
 *     responses:
 *       200:
 *         description: Raw SQL query of the specified panel retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                   id:
 *                     type: integer
 *                     description: The panel ID within the dashboard
 *                     example: 3
 *                   title:
 *                     type: string
 *                     description: The title of the panel
 *                     example: "CPU Usage"
 *                   displayName:
 *                     type: string
 *                     description: Display name for the data field
 *                     example: "CPU Load"
 *                   rawSql:
 *                     type: string
 *                     description: The raw SQL query used by the panel
 *                     example: "SELECT * FROM server_metrics WHERE status = 'active'"
 *                   type:
 *                     type: string
 *                     description: The type of the panel (e.g., graph, table, etc.)
 *                     example: "graph"
 *       404:
 *         description: Panel not found in dashboard
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Panel not found in dashboard"
 *       500:
 *         description: Failed to retrieve dashboard or panel due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to retrieve dashboard in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
