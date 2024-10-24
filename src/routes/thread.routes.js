import { Router } from "express";

import { verifyAuthority } from "../middleware/verifyAuth.js";
import {
    getThreads,
    getThreadsByUserId,
    createThread,
    deleteThread,
    addNewMessage,
    getThreadMessages,
    deleteUserThreads,
    changeThreadName,
} from "../controllers/thread.controller.js";
import { validateParams } from "../middleware/validation.js";

const router = Router();

router.get("/threads", validateParams, verifyAuthority, getThreads);
router.get("/thread", validateParams, verifyAuthority, getThreadsByUserId);
router.get(
    "/thread/:gptId",
    validateParams,
    verifyAuthority,
    getThreadMessages
);
router.post("/thread", validateParams, verifyAuthority, createThread);
router.post("/thread/:gptId", validateParams, verifyAuthority, addNewMessage);
router.delete("/thread/:gptId", validateParams, verifyAuthority, deleteThread);
router.delete("/thread/", validateParams, verifyAuthority, deleteUserThreads);
router.put("/thread/:gptId", validateParams, verifyAuthority, changeThreadName);

export default router;

/**
 * Retrieves all threads.
 * @swagger
 * tags:
 *   name: Threads
 *   description: OpenAI Threads management
 * /api/threads:
 *   get:
 *     summary: Retrieves all threads
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of threads
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Thread'
 *       500:
 *         description: Failed to get all threads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * Retrieves threads by user ID.
 * @swagger
 * /api/thread:
 *   get:
 *     summary: Retrieves threads by user ID
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of threads belonging to the user
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Thread'
 *       500:
 *         description: Failed to get user threads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */

/**
 * Retrieves messages of a thread by GPT ID.
 * @swagger
 * /api/thread/{gptId}:
 *   get:
 *     summary: Retrieves messages of a thread by GPT ID
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gptId
 *         required: true
 *         description: GPT ID of the thread to retrieve messages from
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Messages of the thread
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   message:
 *                     type: string
 *                   timestamp:
 *                     type: string
 *       500:
 *         description: Failed to retrieve thread messages
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
/**
 * Creates a new thread.
 * @swagger
 * /api/thread:
 *   post:
 *     summary: Creates a new thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assistantId:
 *                 type: string
 *                 description: The ID of the assistant
 *               content:
 *                 type: string
 *                 description: The content of the message
 *     responses:
 *       201:
 *         description: Thread created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                   description: The ID of the created thread
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: The message must be at least 15 words
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to create thread
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

/**
 * Adds a new message to a thread.
 * @swagger
 * /api/thread/{gptId}:
 *   post:
 *     summary: Adds a new message to a thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gptId
 *         required: true
 *         description: GPT ID of the thread to add the message to
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 description: The content of the message
 *               assistantId:
 *                 type: string
 *                 description: The ID of the assistant
 *     responses:
 *       201:
 *         description: Message added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       400:
 *         description: The message must be at least 15 words
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to create message or thread
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: Error message
 */

/**
 * Deletes a thread.
 * @swagger
 * /api/thread/{gptId}:
 *   delete:
 *     summary: Deletes a thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gptId
 *         required: true
 *         description: GPT ID of the thread to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Thread deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Thread not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to delete thread
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */

/**
 * Deletes all threads of the current user.
 * @swagger
 * /api/thread/:
 *   delete:
 *     summary: Deletes all threads of the current user
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Threads deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       500:
 *         description: Failed to delete threads
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */

/**
 * Changes the name of a thread.
 * @swagger
 * /api/thread/{gptId}:
 *   put:
 *     summary: Changes the name of a thread
 *     tags: [Threads]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: gptId
 *         required: true
 *         description: GPT ID of the thread to update
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The new name for the thread
 *     responses:
 *       200:
 *         description: Thread name updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Success message
 *       404:
 *         description: Thread not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to update thread name
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
