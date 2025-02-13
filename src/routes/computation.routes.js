import { Router } from 'express';
import { validateUUID} from '../middleware/validation.js';
import {
  getComputations,
  getComputationsById,
  createComputation,
  bulkCreateComputations,
  deleteComputations,
} from '../controllers/computation.controller.js';

const router = Router();

router.get('', getComputations);
router.delete('', deleteComputations);
router.get('/:id', validateUUID('id'), getComputationsById);
router.post('', createComputation);
router.post('/bulk', bulkCreateComputations);

export default router;

/**
 * @swagger
 * tags:
 *   name: Computations
 *   description: Computations management
 */
/**
 * @swagger
 * /computation:
 *   get:
 *     summary: Retrieves all computations
 *     tags: [Computations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of computations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Computation'
 *       500:
 *         description: Failed to get computations
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
 * /computation/{id}:
 *   get:
 *     summary: Retrieves a computation by computationGroup
 *     tags: [Computations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description:  The computationGroup
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single computation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Computation'
 *       202:
 *         description: Computation not ready yet
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Computation not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get computation
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
 * /computation:
 *   post:
 *     summary: Start a new Node-RED computation
 *     tags: [Computations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Computation'
 *           example:
 *             metric:
 *               endpoint: "/test"
 *               params:
 *                 example: "value1"
 *             config:
 *               backendUrl: "http://status-backend:3001/api/v1/computation/bulk"
 *     responses:
 *       201:
 *         description: The created computation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Computation'
 *       500:
 *         description: Failed to create computation
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
 * /computation/bulk:
 *   post:
 *     summary: Creates multiple computations
 *     tags: [Computations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               computations:
 *                 type: array
 *                 items:
 *                   $ref: '#/components/schemas/Computation'
 *               done:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: The created computations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Computation'
 *       500:
 *         description: Failed to create computations
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
 * /computation:
 *   delete:
 *     summary: Deletes all computations
 *     tags: [Computations]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: No content, all computations deleted
 *       500:
 *         description: Failed to delete computations
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
 * /controls/{controlId}/computations:
 *   get:
 *     summary: Retrieves computations by control ID
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: controlId
 *         schema:
 *           type: integer
 *           format: id
 *         required: true
 *         description: The control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of computations for the control
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Computation'
 *       500:
 *         description: Failed to get computations
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
 * /controls/{controlId}/computations/{createdAt}:
 *   get:
 *     summary: Retrieves computations by control ID and creation date
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: controlId
 *         schema:
 *           type: integer
 *           format: id
 *         required: true
 *         description: The control ID
 *       - in: path
 *         name: createdAt
 *         schema:
 *           type: string
 *           format: date
 *         required: true
 *         description: The creation date of the computation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of computations for the control with the specified creation date
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Computation'
 *       500:
 *         description: Failed to get computations
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
 * /controls/{controlId}/computations:
 *   put:
 *     summary: Sets compute interval for a computation by control ID and creation date
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: controlId
 *         schema:
 *           type: integer
 *           format: id
 *         required: true
 *         description: The control ID
 *       - in: path
 *         name: createdAt
 *         schema:
 *           type: string
 *           format: date-time
 *         required: true
 *         description: The creation date of the computation
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Successfully updated the computation interval
 *       500:
 *         description: Failed to update computation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   delete:
 *     summary: Deletes computations by control ID
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: controlId
 *         schema:
 *           type: integer
 *           format: id
 *         required: true
 *         description: The control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: No content, computations deleted for the control
 *       500:
 *         description: Failed to delete computations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */