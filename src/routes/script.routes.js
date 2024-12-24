import { Router } from 'express';
import express from 'express';
import {
  createScript,
  getAllScripts,
  getScriptById,
  updateScript,
  deleteScript,
  deleteAllScripts,
  parseScript,
} from '../controllers/script.controller.js';

import { verifyAuthority } from '../middleware/verifyAuth.js';

const router = Router();

router.post('', verifyAuthority, createScript);
router.get('', verifyAuthority, getAllScripts);
router.delete('', verifyAuthority, deleteAllScripts);
router.post('/parse', express.text(), parseScript);
router.get('/:id', getScriptById);
router.put('/:id', verifyAuthority, updateScript);
router.delete('/:id', verifyAuthority, deleteScript);

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
 * /scripts/parse:
 *   post:
 *     summary: Parses a JavaScript code snippet
 *     description: >
 *       Receives a JavaScript code snippet, validates that it includes a `module.exports.main` function,
 *       and returns the parsed version of the code.
 *     tags:
 *       - Scripts
 *     requestBody:
 *       required: true
 *       content:
 *         text/plain:
 *           schema:
 *             type: string
 *           description: The JavaScript code snippet to parse, sent as plain text.
 *     responses:
 *       200:
 *         description: Successfully parsed JavaScript code.
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               example: |
 *                 module.exports.main = async () => {
 *                   console.log("Hello World");
 *                 };
 *       400:
 *         description: Bad request - the code snippet does not include a `module.exports.main` function.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: The code must include a module.exports.main function.
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *               example:
 *                 error: Internal server error
 */


/**
 * @swagger
 * /scripts/{id}:
 *   get:
 *     summary: Retrieves a script by ID
 *     tags: [Scripts]
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
 *           application/javascript:
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
