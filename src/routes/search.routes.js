import { Router } from 'express';
import { searchItems } from '../controllers/search.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grafana Search
 *   description: Grafana Search for dashboards and folders
 */

/**
 * @swagger
 * /grafana/search:
 *   get:
 *     summary: Search for dashboards and folders in Grafana
 *     description: >
 *       When using Role-based access control, search results will contain only dashboards and folders which you have access to.
 *     tags: [Grafana Search]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *         description: Search Query.
 *       - in: query
 *         name: tag
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: List of tags to search for.
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Type to search for, dash-folder or dash-db.
 *       - in: query
 *         name: dashboardUIDs
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: List of dashboard uid's to search for.
 *       - in: query
 *         name: folderUIDs
 *         schema:
 *           type: array
 *           items:
 *             type: string
 *         description: List of folder UIDs to search in.
 *       - in: query
 *         name: starred
 *         schema:
 *           type: boolean
 *         description: Flag indicating if only starred dashboards should be returned.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 1000
 *           maximum: 5000
 *         description: Limit the number of returned results (max is 5000; default is 1000).
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Use this parameter to access hits beyond limit. Numbering starts at 1. The limit parameter acts as the page size.
 *     responses:
 *       200:
 *         description: Search results retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 dashboards:
 *                   type: array
 *                   items:
 *                     type: object
 *                 folders:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Bad Request - Invalid search parameters
 *       401:
 *         description: Unauthorized - Invalid or missing authentication
 *       500:
 *         description: Internal Server Error - Failed to retrieve search results
 */
router.get('/search', searchItems);

export default router;
