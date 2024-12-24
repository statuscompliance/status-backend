import { Router } from 'express';
import { refreshToken } from '../controllers/refresh.controller.js';
import { validateParams } from '../middleware/validation.js';

const router = Router();

router.get('/refresh', validateParams, refreshToken);

export default router;

/**
 * Refreshes the access token using the refresh token.
 * @swagger
 * /api/refresh:
 *   get:
 *     summary: Refreshes the access token using the refresh token
 *     tags: [Auth]
 *     parameters:
 *       - in: header
 *         name: Authorization
 *         required: true
 *         description: Bearer token used to authenticate the user
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Access token refreshed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   description: The new access token
 *       401:
 *         description: No token provided or Invalid token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 *       500:
 *         description: Failed to refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   description: Error message
 */
