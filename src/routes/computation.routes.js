import { Router } from "express";

import {
    getComputations,
    getComputationsById,
    getComputationsByControlId,
    createComputation,
    bulkCreateComputations,
    deleteComputations,
    deleteComputationByControlId,
    getComputationsByControlIdAndCreationDate,
    setComputeIntervalBytControlIdAndCreationDate,
} from "../controllers/computation.controller.js";

const router = Router();

router.get("/computation", getComputations);
router.delete("/computation", deleteComputations);
router.get("/computation/:id", getComputationsById);
router.get("/controls/:control_id/computations", getComputationsByControlId);
router.get(
    "/controls/:control_id/computations/:createdAt",
    getComputationsByControlIdAndCreationDate
);
router.put(
    "/controls/:control_id/computations",
    setComputeIntervalBytControlIdAndCreationDate
);
router.post("/computation", createComputation);
router.post("/computations", bulkCreateComputations);
router.delete(
    "/controls/:control_id/computations",
    deleteComputationByControlId
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Computations
 *   description: Computations management
 */
/**
 * @swagger
 * /api/computation:
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
 * /api/computation/{id}:
 *   get:
 *     summary: Retrieves a single computation
 *     tags: [Computations]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The computation ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single computation
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Computation'
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
 * /api/computation:
 *   post:
 *     summary: Creates a new computation
 *     tags: [Computations]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Computation'
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
 * /api/computations:
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
 *             type: array
 *             items:
 *               $ref: '#/components/schemas/Computation'
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
 * /api/computation:
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
 * /api/controls/{control_id}/computations:
 *   get:
 *     summary: Retrieves computations by control ID
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: control_id
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
 * /api/controls/{control_id}/computations/{createdAt}:
 *   get:
 *     summary: Retrieves computations by control ID and creation date
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: control_id
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
 * /api/controls/{control_id}/computations:
 *   put:
 *     summary: Sets compute interval for a computation by control ID and creation date
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: control_id
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
 *               start_compute:
 *                 type: string
 *                 format: date-time
 *                 description: The start time of the computation interval
 *               end_compute:
 *                 type: string
 *                 format: date-time
 *                 description: The end time of the computation interval
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
 *         name: control_id
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
