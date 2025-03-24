import { Router } from 'express';
import {
  getCatalogs,
  getCatalog,
  createCatalog,
  updateCatalog,
  deleteCatalog,
  calculatePoints,
  getDraftCatalogs,
  createDraftCatalog,
  finalizeCatalog,
} from '../controllers/catalog.controller.js';
import { getCatalogControls } from '../controllers/control.controller.js';


const router = Router();

// Draft Catalogs
router.get('/drafts', getDraftCatalogs);
router.post('/drafts', createDraftCatalog);
router.patch('/:id/finalize', finalizeCatalog);

// Catalogs
router.get('', getCatalogs);
router.get('/:id', getCatalog);
router.post('', createCatalog);
router.patch('/:id', updateCatalog);
router.delete('/:id', deleteCatalog);
router.get('/:tpaId/points', calculatePoints);
router.get('/:catalogId/controls', getCatalogControls);


export default router;

/**
 * @swagger
 * tags:
 *   name: Catalogs
 *   description: Catalog management
 */

/**
 * @swagger
 * /catalogs:
 *   get:
 *     summary: Retrieves all catalogs
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of catalogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Catalog'
 *       500:
 *         description: Failed to get all catalogs
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
 * /catalogs/{id}:
 *   get:
 *     summary: Retrieves a single catalog
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The catalog ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single catalog
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Catalog'
 *       404:
 *         description: Catalog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get catalog
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
 * /catalogs:
 *   post:
 *     summary: Creates a new catalog
 *     tags: [Catalogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Catalog'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Catalog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Catalog'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create catalog
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
 * /catalogs/{id}:
 *   patch:
 *     summary: Updates an existing catalog
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The catalog ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Catalog'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalog updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Catalog'
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
 *         description: Catalog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update catalog
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
 * /catalogs/{id}:
 *   delete:
 *     summary: Deletes a catalog
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The catalog ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalog deleted successfully
 *       404:
 *         description: Catalog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete catalog
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
 * /catalogs/{tpaId}/points:
 *   get:
 *     summary: Calculates and retrieves points for a computation by tpaId
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: tpaId
 *         schema:
 *           type: string
 *         required: true
 *         description: The Bluejay Agreement ID (tpaId)
 *       - in: query
 *         name: from
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: The start date for the points calculation
 *       - in: query
 *         name: to
 *         schema:
 *           type: string
 *           format: date-time
 *         required: false
 *         description: The end date for the points calculation
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of calculated points
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Point'
 *       500:
 *         description: Failed to get points
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
 * /catalogs/drafts:
 *   get:
 *     summary: Retrieves all draft catalogs
 *     tags: [Catalogs]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of draft catalogs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Catalog'
 *       500:
 *         description: Failed to get draft catalogs
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
 * /catalogs/drafts:
 *   post:
 *     summary: Creates a new draft catalog
 *     tags: [Catalogs]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Catalog'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Draft catalog created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Catalog'
 *       400:
 *         description: Invalid input
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to create draft catalog
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
 * /catalogs/{id}/finalize:
 *   patch:
 *     summary: Finalizes a draft catalog
 *     tags: [Catalogs]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The catalog ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Catalog finalized successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Catalog'
 *       400:
 *         description: Cannot finalize (missing required fields or already finalized)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: Catalog not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to finalize catalog
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */