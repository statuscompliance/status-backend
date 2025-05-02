import { Router } from 'express';
import {
  signIn,
  signUp,
  signOut,
  getUsers,
  getAuthority,
  deleteUserById,
  refreshToken,
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
