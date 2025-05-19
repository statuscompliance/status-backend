import { Router } from 'express';
import { validateUUID } from '../middleware/validation.js';
import { 
  createDashboard,
  createDashboardTemplate,
  createTemporaryDashboard,
  importDashboard,
  getDashboardByUID,
  deleteDashboardByUID
} from '../controllers/dashboard.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grafana Dashboards
 *   description: Grafana Dashboards management
 */

/**
 * @swagger
 * /grafana/dashboard:
 *   post:
 *     summary: Creates a new dashboard in Grafana
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
 *                 required: true
 *                 properties:
 *                   title:
 *                     type: string
 *                     description: Title of the dashboard
 *                   panels:
 *                     type: array
 *                     items:
 *                       type: object
 *                 description: Dashboard configuration object
 *               overwrite:
 *                 type: boolean
 *                 description: Whether to overwrite existing dashboard with same name
 *                 default: true
 *               folderUid:
 *                 type: string
 *                 description: UID of the folder to place dashboard in
 *     responses:
 *       201:
 *         description: Dashboard created successfully
 *       400:
 *         description: Bad request - Invalid dashboard configuration
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       500:
 *         description: Failed to create dashboard in Grafana
 */
router.post('/dashboard', createDashboard);

/**
 * @swagger
 * /grafana/dashboard/template:
 *   post:
 *     summary: Creates a new dashboard template in Grafana
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
 *               name:
 *                 type: string
 *                 description: Name of the dashboard template
 *               folderId:
 *                 type: string
 *                 description: ID of the folder to place dashboard in
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: Start date for dashboard time range
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: End date for dashboard time range
 *     responses:
 *       201:
 *         description: Dashboard template created successfully
 *       400:
 *         description: Bad request - Invalid template configuration
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       500:
 *         description: Failed to create dashboard template in Grafana
 */
router.post('/dashboard/template', createDashboardTemplate);

/**
 * @swagger
 * /grafana/dashboard/temp:
 *   post:
 *     summary: Creates a temporary dashboard in Grafana
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
 *               panelConfig:
 *                 type: object
 *                 description: Configuration for the panel to be created
 *               title:
 *                 type: string
 *                 description: Title of the temporary dashboard
 *               baseDashboardUid:
 *                 type: string
 *                 description: UID of base dashboard to use as template
 *               timeRange:
 *                 type: object
 *                 properties:
 *                   from:
 *                     type: string
 *                     description: Start time range
 *                     example: "now-6h"
 *                   to:
 *                     type: string
 *                     description: End time range
 *                     example: "now"
 *               autoCleanup:
 *                 type: boolean
 *                 description: Whether to automatically clean up the temporary dashboard
 *                 default: true
 *     responses:
 *       201:
 *         description: Temporary dashboard created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Temporary dashboard created successfully"
 *                 dashboard:
 *                   type: object
 *                 isTemporary:
 *                   type: boolean
 *                   example: true
 *                 created:
 *                   type: string
 *                   format: date-time
 *       400:
 *         description: Bad request - Invalid configuration
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       409:
 *         description: Conflict - Dashboard with same title already exists
 *       500:
 *         description: Failed to create temporary dashboard in Grafana
 */
router.post('/dashboard/temp', createTemporaryDashboard);

/**
 * @swagger
 * /grafana/dashboard/import:
 *   post:
 *     summary: Imports an existing dashboard into Grafana
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
 *                 description: Dashboard configuration object
 *               overwrite:
 *                 type: boolean
 *                 description: Whether to overwrite existing dashboard with same name
 *                 default: true
 *               folderUid:
 *                 type: string
 *                 description: UID of the folder to place dashboard in
 *     responses:
 *       201:
 *         description: Dashboard imported successfully
 *       400:
 *         description: Bad request - Invalid dashboard configuration
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       500:
 *         description: Failed to import dashboard in Grafana
 */
router.post('/dashboard/import', importDashboard);

/**
 * @swagger
 * /grafana/dashboard/{uid}:
 *   get:
 *     summary: Retrieves a dashboard by UID from Grafana
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the dashboard to retrieve
 *     responses:
 *       200:
 *         description: Dashboard retrieved successfully
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       404:
 *         description: Not found - Dashboard with specified UID not found
 *       500:
 *         description: Failed to retrieve dashboard from Grafana
 */
router.get('/dashboard/:uid', validateUUID('uid'), getDashboardByUID);

/**
 * @swagger
 * /grafana/dashboard/{uid}:
 *   delete:
 *     summary: Deletes a dashboard by UID from Grafana
 *     tags: [Grafana Dashboards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: uid
 *         required: true
 *         schema:
 *           type: string
 *         description: UID of the dashboard to delete
 *     responses:
 *       200:
 *         description: Dashboard deleted successfully
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       404:
 *         description: Not found - Dashboard with specified UID not found
 *       500:
 *         description: Failed to delete dashboard from Grafana
 */
router.delete('/dashboard/:uid', validateUUID('uid'), deleteDashboardByUID);

export default router;
