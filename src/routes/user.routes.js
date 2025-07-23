import { Router } from 'express';
import {
  signIn,
  signUp,
  signOut,
  getUsers,
  getAuthority,
  deleteUserById,
  refreshToken,
  whoami,
  setup2FA,
  verify2FA,
  get2FAStatus,
  disable2FA,
} from '../controllers/user.controller.js';
import { verifyAdmin } from '../middleware/verifyAdmin.js';
import { verifyAuthority } from '../middleware/verifyAuth.js';

export default function () {
  const router = Router();
  router.get('', getUsers);


  router.post('/signIn', signIn);
  router.get('/signOut', signOut);

  router.post('/signUp', verifyAdmin, signUp);
  router.get('/auth', verifyAuthority, getAuthority);
  router.get('/auth/refresh', refreshToken);

  router.delete('/:id', deleteUserById); //TODO: add auth middleware
  router.get('/whoami', verifyAuthority, whoami);


  router.post('/2fa/setup', verifyAdmin, setup2FA);
  router.post('/2fa/verify', verifyAdmin, verify2FA);
  router.get('/2fa/status', verifyAuthority, get2FAStatus);
  router.post('/2fa/disable', verifyAuthority, disable2FA);
  return router;
}

/**
 * @swagger
 * /users/signUp:
 *   post:
 *     summary: Creates a new user account
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       400:
 *         description: Username already exists
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create user
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
 * /users/signIn:
 *   post:
 *     summary: Authenticates a user and generates access and refresh tokens
 *     tags:
 *       - Auth
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User authenticated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 username:
 *                   type: string
 *                 authority:
 *                   type: string
 *                 email:
 *                   type: string
 *                 accessToken:
 *                   type: string
 *                 refreshToken:
 *                   type: string
 *       401:
 *         description: Invalid password or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
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
 * /users/signOut:
 *   post:
 *     summary: Logs out a user by clearing all cookies (accessToken, refreshToken, nodeRedToken)
 *     tags: [Auth]
 *     responses:
 *       204:
 *         description: User logged out successfully
 *       404:
 *         description: No user found for provided refresh token
 *       400:
 *         description: No refresh token provided
 *       500:
 *         description: Internal server error
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
 * /users/auth/:
 *   get:
 *     summary: Retrieves the authority of the authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: The authority of the user
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 authority:
 *                   type: string
 *       500:
 *         description: Internal server error
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
 * /users/auth/refresh:
 *   get:
 *     summary: Refreshes the access token using a valid refresh token
 *     tags: [Auth]
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
 *       400:
 *         description: No refresh token provided
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: Invalid or expired refresh token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Internal server error
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
 * /users/whoami:
 *   get:
 *     summary: Returns info about the currently authenticated user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Authenticated user info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 username:
 *                   type: string
 *                 email:
 *                   type: string
 *                 authority:
 *                   type: string
 *                 createdAt:
 *                   type: string
 *                   format: date-time
 *                 updatedAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized - No token or invalid
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */

/**
 * @swagger
 * /users/2fa/setup:
 *   post:
 *     summary: Generates a QR code to configure 2FA for the current user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: QR code generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 qrCode:
 *                   type: string
 *       401:
 *         description: Unauthorized
 */

/**
 * @swagger
 * /users/2fa/verify:
 *   post:
 *     summary: Verifies the 2FA token and enables 2FA
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               totpToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA activated
 *       401:
 *         description: Invalid 2FA totpToken
 */

/**
 * @swagger
 * /users/2fa/status:
 *   get:
 *     summary: Returns 2FA activation status for the current user
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: 2FA status returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 twofa_enabled:
 *                   type: boolean

 * /users/2fa/disable:
 *   post:
 *     summary: Disables 2FA for the current user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               password:
 *                 type: string
 *               totpToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: 2FA disabled
 *       401:
 *         description: Invalid password or token
 *       400:
 *         description: 2FA not enabled
 */
