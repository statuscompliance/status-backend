import { Router } from "express";
import {
  getInputControls,
  getInputControl,
  getValuesByInputIdAndControlId,
  createInputControl,
  updateInputControl,
  deleteInputControl,
} from "../controllers/input_control.controller.js";

const router = Router();

// Input_controls
router.get("/input_controls", getInputControls);
router.get("/input_controls/:id", getInputControl);
router.get("/input_controls/:input_id/controls/:control_id/values", getValuesByInputIdAndControlId);
router.post("/input_controls", createInputControl);
router.patch("/input_controls/:id", updateInputControl);
router.delete("/input_controls/:id", deleteInputControl);

export default router;

/**
 * @swagger
 * tags:
 *   name: InputControls
 *   description: Input control management
 */

/**
 * @swagger
 * /api/input_controls:
 *   get:
 *     summary: Retrieves all input controls
 *     tags: [InputControls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of input controls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InputControl'
 *       500:
 *         description: Failed to get all input controls
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
 * /api/input_controls/{id}:
 *   get:
 *     summary: Retrieves a single input control
 *     tags: [InputControls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single input control
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InputControl'
 *       404:
 *         description: InputControl not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get input control
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
 * /api/input_controls/{input_id}/controls/{control_id}/values:
 *   get:
 *     summary: Retrieves values by input ID and control ID
 *     tags: [InputControls]
 *     parameters:
 *       - in: path
 *         name: input_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input ID
 *       - in: path
 *         name: control_id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Values retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 value:
 *                   type: string
 *       404:
 *         description: Values not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get values
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
 * /api/input_controls:
 *   post:
 *     summary: Creates a new input control
 *     tags: [InputControls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *                 description: The value of the input control
 *                 example: Example Value
 *               input_id:
 *                 type: integer
 *                 description: The ID of the input
 *                 example: 1
 *               control_id:
 *                 type: integer
 *                 description: The ID of the control
 *                 example: 1
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Input control created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 value:
 *                   type: string
 *                 input_id:
 *                   type: integer
 *                 control_id:
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
 *       404:
 *         description: Control or Input not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create input control
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
 * /api/input_controls/{id}:
 *   patch:
 *     summary: Updates an existing input control
 *     tags: [InputControls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input control ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               value:
 *                 type: string
 *               input_id:
 *                 type: integer
 *               control_id:
 *                 type: integer
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Input control updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/InputControl'
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
 *         description: Input control not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update input control
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
 * /api/input_controls/{id}:
 *   delete:
 *     summary: Deletes an input control
 *     tags: [InputControls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The input control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: Input control deleted successfully
 *       404:
 *         description: Input control not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete input control
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
