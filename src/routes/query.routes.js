import { Router } from 'express';
import { 
  parseQuery,
  createQuery
} from '../controllers/query.controller.js';

const router = Router();

/**
 * @swagger
 * tags:
 *   name: Grafana Queries
 *   description: Grafana SQL Query builder and parser
 */

/**
 * @swagger
 * /grafana/sql/build:
 *   post:
 *     summary: Creates a SQL query based on provided parameters using a Sequelize model.
 *     tags: [Grafana Queries]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               model:
 *                 type: string
 *                 description: The Sequelize model name to perform the operation on.
 *                 example: "Point"
 *               operation:
 *                 type: string
 *                 description: The Sequelize operation to perform (e.g., findAll).
 *                 example: "findAll"
 *               options:
 *                 type: object
 *                 description: Additional options for the Sequelize query.
 *                 properties:
 *                   attributes:
 *                     type: array
 *                     items:
 *                       type: string
 *                     example: ["timestamp", "guaranteeValue", "id"]
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
 *                   example: "SELECT timestamp, guaranteeValue, id FROM Point AS points;"
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
router.post('/sql/build', createQuery);

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
router.post('/sql/parse', parseQuery);

export default router;
