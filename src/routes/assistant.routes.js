import { Router } from 'express';
import {
  createAssistant,
  createAssistantWithInstructions,
  getAssistants,
  getAssistantsById,
  deleteAssistantById,
  getAssistantInstructions,
  updateAssistantInstructions,
  deleteAllAssistants,
} from '../controllers/assistant.controller.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { assistantlimitReached } from '../middleware/endpoint.js';

const router = Router();

router.get('', getAssistants);
router.get('/:id', getAssistantsById);
router.get('/:id/instructions', getAssistantInstructions);
router.post('', assistantlimitReached, createAssistant);
router.post(
  '/admin',
  verifyAdmin,
  assistantlimitReached,
  createAssistantWithInstructions
);
router.put('/:id/instructions', updateAssistantInstructions);
router.delete('/:id', deleteAssistantById);
router.delete('', deleteAllAssistants);

export default router;

/**
 * @swagger
 * tags:
 *   name: Assistants
 *   description: OpenAI Assistants management
 *
 * /assistant:
 *   get:
 *     summary: Retrieves a list of all assistants
 *     tags: [Assistants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of assistants
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Assistant'
 *       500:
 *         description: Failed to get assistants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   post:
 *     summary: Creates a new assistant with default settings
 *     tags: [Assistants]
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
 *     responses:
 *       201:
 *         description: Assistant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create assistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *
 *
 * /assistant/admin:
 *   post:
 *     summary: Creates a new assistant
 *     tags: [Assistants]
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
 *               instructions:
 *                 type: string
 *               model:
 *                 type: string
 *               tools:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       201:
 *         description: Assistant created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create assistant
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
 * /assistant/{id}:
 *   get:
 *     summary: Retrieves a specific assistant by ID
 *     tags: [Assistants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the assistant to retrieve
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: A specific assistant
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Assistant'
 *       500:
 *         description: Failed to get the assistant
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
 * /assistant/{id}/instructions:
 *   get:
 *     summary: Retrieves instructions of a specific assistant by ID
 *     tags: [Assistants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the assistant to retrieve instructions from
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Instructions of the assistant
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 instructions:
 *                   type: string
 *       500:
 *         description: Failed to get assistant instructions
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
 * /assistant/{id}/instructions:
 *   put:
 *     summary: Updates instructions of a specific assistant by ID
 *     tags: [Assistants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the assistant to update instructions for
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               instructions:
 *                 type: string
 *     responses:
 *       200:
 *         description: Assistant instructions updated successfully
 *       500:
 *         description: Failed to update assistant instructions
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
 * /assistant/{id}:
 *   delete:
 *     summary: Deletes a specific assistant by ID
 *     tags: [Assistants]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the assistant to delete
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Assistant deleted successfully
 *       400:
 *         description: Assistant id is required
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete the assistant
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
 * /assistant:
 *   delete:
 *     summary: Deletes all assistants
 *     tags: [Assistants]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All assistants deleted successfully
 *       500:
 *         description: Failed to delete all assistants
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
