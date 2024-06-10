import {Router} from 'express'
import {getInputs, getInput, getInputsByMashupId, createInput, updateInput, deleteInput} from '../controllers/input.controller.js'

const router = Router()

router.get('/inputs', getInputs)
router.get('/inputs/:id', getInput)
router.get('/mashups/:mashup_id/inputs', getInputsByMashupId)
router.post('/inputs', createInput)
router.patch('/inputs/:id', updateInput)
router.delete('/inputs/:id', deleteInput) 

export default router

/**
 * @swagger
 * tags:
 *   name: Inputs
 *   description: Input management
 */

/**
 * @swagger
 * /api/inputs:
 *   get:
 *     summary: Retrieves all inputs
 *     tags: [Inputs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of inputs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Input'
 *       500:
 *         description: Failed to get all inputs
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
 * /api/inputs/{id}:
 *   get:
 *     summary: Retrieves a single input
 *     tags: [Inputs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single input
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Input'
 *       404:
 *         description: Input not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get input
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
 * /api/mashups/{mashup_id}/inputs:
 *   get:
 *     summary: Retrieves all inputs for a mashup
 *     tags: [Inputs]
 *     parameters:
 *       - in: path
 *         name: mashup_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The mashup ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of inputs for the mashup
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Input'
 *       404:
 *         description: The mashup has no inputs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get inputs for the mashup
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
 * /api/inputs:
 *   post:
 *     summary: Creates a new input
 *     tags: [Inputs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the input
 *                 example: Age
 *               type:
 *                 type: string
 *                 enum: [STRING, NUMBER]
 *                 description: The type of the input
 *                 example: NUMBER
 *               mashup_id:
 *                 type: integer
 *                 description: The ID of the mashup associated with the input
 *                 example: 1
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Input created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 type:
 *                   type: string
 *                   enum: [STRING, NUMBER]
 *                 mashup_id:
 *                   type: integer
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
 *         description: Failed to create input
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
 * /api/inputs/{id}:
 *   patch:
 *     summary: Updates an existing input
 *     tags: [Inputs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [STRING, NUMBER]
 *               mashup_id:
 *                 type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Input updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Input'
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
 *         description: Input not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update input
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
 * /api/inputs/{id}:
 *   delete:
 *     summary: Deletes an input
 *     tags: [Inputs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Input deleted successfully
 *       404:
 *         description: Input not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
