import { Router } from "express";
import {
  getCatalogs,
  getCatalog,
  createCatalog,
  getTpa,
  saveTpa,
  deleteTPAByCatalogId,
  updateCatalog,
  deleteCatalog,
} from "../controllers/catalog.controller.js";

const router = Router();

// Catalogs
router.get("/catalogs", getCatalogs);
router.get("/catalogs/:id", getCatalog);
router.post("/catalogs", createCatalog);
router.patch("/catalogs/:id", updateCatalog);
router.delete("/catalogs/:id", deleteCatalog);

// TPAs
router.get("/catalogs/:catalog_id/tpa", getTpa);
router.post("/catalogs/tpa", saveTpa);
router.delete("/catalogs/:catalog_id/tpa", deleteTPAByCatalogId);

export default router;

/**
 * @swagger
 * tags:
 *   name: Catalogs
 *   description: Catalog management
 */

/**
 * @swagger
 * /api/catalogs:
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
 * /api/catalogs/{id}:
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
 * /api/catalogs:
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
 * /api/catalogs/{id}:
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
 * /api/catalogs/{id}:
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
