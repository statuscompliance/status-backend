import {Router} from 'express'
import {getMashups, getMashup, createMashup, updateMashup, deleteMashup} from '../controllers/mashup.controller.js'

const router = Router()

router.get('/mashups', getMashups)
router.get('/mashups/:id', getMashup)
router.post('/mashups', createMashup)
router.patch('/mashups/:id', updateMashup)
router.delete('/mashups/:id', deleteMashup)

export default router

/**
 * @swagger
 * tags:
 *   name: Mashups
 *   description: Mashups management
 */

/**
 * @swagger
 * /api/mashups:
 *   get:
 *     summary: Retrieves all mashups
 *     tags: [Mashups]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of mashups
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Mashup'
 *       500:
 *         description: Failed to get all mashups
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/mashups/{id}:
 *   get:
 *     summary: Retrieves a single mashup
 *     tags: [Mashups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mashup ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single mashup
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mashup'
 *       404:
 *         description: Mashup not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get mashup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/mashups:
 *   post:
 *     summary: Creates a new mashup
 *     tags: [Mashups]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mashup'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Mashup created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mashup'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create mashup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/mashups/{id}:
 *   patch:
 *     summary: Updates an existing mashup
 *     tags: [Mashups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mashup ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Mashup'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mashup updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Mashup'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Mashup not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update mashup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * @swagger
 * /api/mashups/{id}:
 *   delete:
 *     summary: Deletes a mashup
 *     tags: [Mashups]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The mashup ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Mashup deleted successfully
 *       404:
 *         description: Mashup not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete mashup
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
