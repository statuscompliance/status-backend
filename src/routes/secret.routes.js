import { Router } from 'express';
import {
  listSecrets,
  getSecret,
  createSecret,
  updateSecret,
  deleteSecret,

} from '../controllers/secret.controller';
import { verifyAuthority } from '../middleware/verifyAuth.js';

export default function () {
  const router = Router();

  router.get('/', verifyAuthority, listSecrets);
  router.get('/:id', verifyAuthority, getSecret);
  router.post('/', verifyAuthority, createSecret);
  router.patch('/:id', verifyAuthority, updateSecret);
  router.delete('/:id', verifyAuthority, deleteSecret);

  return router;
}

/**
 * @swagger
 * tags:
 *   name: Secrets
 *   description: Secrets management
 */

/**
 * @swagger
 * /secrets:
 *   get:
 *     summary: List all secrets owned by the authenticated user
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of masked secrets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Secret'
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /secrets/{id}:
 *   get:
 *     summary: Get a specific secret by ID (owned by the user)
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: The secret metadata
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Secret'
 *       404:
 *         description: Secret not found or unauthorized
 */
/**
 * @swagger
 * /secrets:
 *   post:
 *     summary: Create a new secret
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - type
 *               - environment
 *               - value
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *                 enum: [API_KEY, TOKEN, PASSWORD, OTHER]
 *               environment:
 *                 type: string
 *               value:
 *                 type: string
 *                 description: Plaintext value that will be encrypted
 *     responses:
 *       201:
 *         description: Secret created successfully
 *       400:
 *         description: Missing required fields
 */

/**
 * @swagger
 * /secrets/{id}:
 *   patch:
 *     summary: Update a secret (rotate value or edit metadata)
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               type:
 *                 type: string
 *               environment:
 *                 type: string
 *               value:
 *                 type: string
 *     responses:
 *       200:
 *         description: Secret updated successfully
 *       404:
 *         description: Secret not found or unauthorized
 */

/**
 * @swagger
 * /secrets/{id}:
 *   delete:
 *     summary: Delete a secret
 *     tags: [Secrets]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       204:
 *         description: Secret deleted successfully
 *       404:
 *         description: Secret not found or unauthorized
 */
