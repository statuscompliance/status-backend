import { Router } from 'express';
import { validateUUID } from '../middleware/validation.js';
import { 
  getFolders,
  createFolder,
  getFolderByUID,
  deleteFolder,
  getFolderDashboardsByUID
} from '../controllers/folder.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grafana Folders
 *   description: Grafana Folders management
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
 */
router.get('/folder', getFolders);

/**
 * @swagger
 * /grafana/folder:
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
router.post('/folder', createFolder);

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
router.get('/folder/:uid', validateUUID('uid'), getFolderByUID);

/**
 * @swagger
 * /grafana/folder/{uid}:
 *   delete:
 *     summary: Deletes a folder by UID from Grafana
 *     tags: [Grafana Folders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: uid
 *         in: path
 *         required: true
 *         description: UID of the folder to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Folder deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Folder deleted successfully"
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
 *                   example: "You do not have permission to delete this folder."
 *       404:
 *         description: Not Found - Folder with the specified UID does not exist
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Folder not found"
 *                 error:
 *                   type: string
 *                   example: "No folder found with UID: 5678."
 *       500:
 *         description: Failed to delete folder in Grafana due to server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Failed to delete folder in Grafana due to server error"
 *                 error:
 *                   type: string
 *                   example: "Internal Server Error"
 */
router.delete('/folder/:uid', validateUUID('uid'), deleteFolder);

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
router.get('/folder/:uid/dashboard', getFolderDashboardsByUID);

export default router;
