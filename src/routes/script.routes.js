import { Router } from 'express';
import {
  createScript,
  getAllScripts,
  getScriptById,
  updateScript,
  deleteScript,
  deleteAllScripts,
} from '../controllers/script.controller.js';

const router = Router();

router.post('', createScript);
router.get('', getAllScripts);
router.delete('', deleteAllScripts);
router.get('/:id', getScriptById);
router.put('/:id', updateScript);
router.delete('/:id', deleteScript);

export default router;

/**
 * @swagger
 * tags:
 *   name: Scripts
 *   description: Script management API
 */

/**
 * @swagger
 * /scripts:
 *   post:
 *     summary: Creates a new script
 *     tags: [Scripts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *             properties:
 *               code:
 *                 type: string
 *                 description: JavaScript code for the script
 *               metadata:
 *                 type: object
 *                 description: Metadata for the script
 *     responses:
 *       201:
 *         description: Script created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Script creado exitosamente
 *                 id:
 *                   type: string
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /scripts:
 *   get:
 *     summary: Retrieves all scripts
 *     tags: [Scripts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of scripts
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   code:
 *                     type: string
 *                   metadata:
 *                     type: object
 *                   createdAt:
 *                     type: string
 *                     format: date-time
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /scripts:
 *   delete:
 *     summary: Deletes all scripts
 *     tags: [Scripts]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Successfully deleted all scripts
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */


/**
 * @swagger
 * /scripts/{id}:
 *   get:
 *     summary: Retrieves a script by ID
 *     tags: [Scripts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the script to retrieve
 *     responses:
 *       200:
 *         description: A script object
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 code:
 *                   type: string
 *                 metadata:
 *                   type: object
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *       404:
 *         description: Script not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /scripts/{id}:
 *   put:
 *     summary: Updates a script by ID
 *     tags: [Scripts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the script to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               code:
 *                 type: string
 *                 description: Updated JavaScript code
 *               metadata:
 *                 type: object
 *                 description: Updated metadata
 *     responses:
 *       200:
 *         description: Script updated successfully
 *       404:
 *         description: Script not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /scripts/{id}:
 *   delete:
 *     summary: Deletes a script by ID
 *     tags: [Scripts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the script to delete
 *     responses:
 *       200:
 *         description: Script deleted successfully
 *       404:
 *         description: Script not found
 *       500:
 *         description: Internal server error
 */
