import { Router } from 'express';
import { checkIdParam, validateUUID} from '../middleware/validation.js';
import {
  getAllScopes,
  getScopeById,
  deleteScope,
  createScope,
  updateScope,
  getAllScopeSets,
  createScopeSet,
  getScopeSetsByControlId,
  getScopeSetById,
  updateScopeSetById
} from '../controllers/scope.controller.js';

const router = Router();

router.get('/sets', getAllScopeSets);
router.post('/sets', createScopeSet);
router.get('/sets/:id', checkIdParam, getScopeSetById);
router.put('/sets/:id', checkIdParam, updateScopeSetById);
router.get('/sets/control/:controlId', getScopeSetsByControlId);
router.get('', getAllScopes);
router.get('/:id', validateUUID('id'), getScopeById);
router.post('', createScope);
router.put('/:id', validateUUID('id'), updateScope);
router.delete('/:id', validateUUID('id'), deleteScope);


export default router;

/**
 * @swagger
 * tags:
 *   name: Scopes
 *   description: Scope specification management
 */

/**
 * @swagger
 * /scopes:
 *   get:
 *     summary: Retrieves all scopes
 *     tags: [Scopes]
 *     responses:
 *       200:
 *         description: A list of scopes
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Scope'
 *       500:
 *         description: Failed to get scopes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /scopes/{id}:
 *   get:
 *     summary: Retrieves a scope by ID
 *     tags: [Scopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The scope ID
 *     responses:
 *       200:
 *         description: A scope object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scope'
 *       404:
 *         description: Scope not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to get scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /scopes:
 *   post:
 *     summary: Creates a new scope
 *     tags: [Scopes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Scope'
 *     responses:
 *       201:
 *         description: The created scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scope'
 *       500:
 *         description: Failed to create scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /scopes/{id}:
 *   put:
 *     summary: Updates a scope by ID
 *     tags: [Scopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The scope ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Scope'
 *     responses:
 *       200:
 *         description: The updated scope
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Scope'
 *       404:
 *         description: Scope not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to update scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /scopes/{id}:
 *   delete:
 *     summary: Deletes a scope by ID
 *     tags: [Scopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The scope ID
 *     responses:
 *       204:
 *         description: No content
 *       404:
 *         description: Scope not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to delete scope
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */


/**
 * @swagger
 * /scopes/sets:
 *   get:
 *     summary: Retrieves all scope sets
 *     tags: [Scopes]
 *     responses:
 *       200:
 *         description: A list of scope sets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScopeSet'
 *       500:
 *         description: Failed to get scope sets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

/**
 * @swagger
 * /scopes/sets:
 *   post:
 *     summary: Creates a new scope set
 *     tags: [Scopes]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScopeSet'
 *     responses:
 *       201:
 *         description: The created scope set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScopeSet'
 *       500:
 *         description: Failed to create scope set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */



/**
 * @swagger
 * /scopes/sets/{id}:
 *   get:
 *     summary: Retrieves a scope set by ID
 *     tags: [Scopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The scope set ID
 *     responses:
 *       200:
 *         description: A scope set object
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScopeSet'
 *       404:
 *         description: Scope set not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to get scope set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
*/

/**
 * @swagger
 * /scopes/sets/{id}:
 *   put:
 *     summary: Updates a scope set by ID
 *     tags: [Scopes]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The scope set ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ScopeSet'
 *     responses:
 *       200:
 *         description: The updated scope set
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ScopeSet'
 *       404:
 *         description: Scope set not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to update scope set
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */


/**
 * @swagger
 * /scopes/sets/control/{controlId}:
 *   get:
 *     summary: Retrieves scope sets by control ID
 *     tags: [Scopes]
 *     parameters:
 *       - in: path
 *         name: controlId
 *         required: true
 *         schema:
 *           type: string
 *         description: The control ID
 *     responses:
 *       200:
 *         description: A list of scope sets
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/ScopeSet'
 *       404:
 *         description: Scope sets not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Failed to get scope sets
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
