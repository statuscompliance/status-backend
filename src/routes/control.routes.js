import { Router } from 'express';
import {
  getControls,
  getControl,
  createControl,
  updateControl,
  deleteControl,
  addPanelToControl,
  getPanelsByControlId,
  deletePanelFromControl,
} from '../controllers/control.controller.js';

import { 
  getComputationsByControlId,
  deleteComputationByControlId,
  getComputationsByControlIdAndCreationDate,
  setComputeIntervalBytControlIdAndCreationDate,
} from '../controllers/computation.controller.js';

import { checkIdParam } from '../middleware/validation.js';

const router = Router();

// Controls
router.get('', getControls);
router.get('/:id', checkIdParam, getControl);
router.post('', createControl);
router.patch('/:id',  checkIdParam, updateControl);
router.delete('/:id', checkIdParam, deleteControl);

router.get('/:id/panels', getPanelsByControlId);
router.post('/:id/panel/:panelId', addPanelToControl);
router.delete('/:id/panels/:panelId', deletePanelFromControl);

// Controls computations 
router.get('/controls/:controlId/computations', getComputationsByControlId);
router.get(
  '/controls/:controlId/computations/:createdAt',
  getComputationsByControlIdAndCreationDate
);
router.put(
  '/controls/:controlId/computations',
  setComputeIntervalBytControlIdAndCreationDate
);
router.delete(
  '/controls/:controlId/computations',
  deleteComputationByControlId
);

export default router;

/**
 * @swagger
 * tags:
 *   name: Controls
 *   description: Control management
 */

/**
 * @swagger
 * /controls:
 *   get:
 *     summary: Retrieves all controls
 *     tags: [Controls]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of controls
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Control'
 *       500:
 *         description: Failed to get all controls
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
 * /controls/{id}:
 *   get:
 *     summary: Retrieves a single control
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single control
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Control'
 *       404:
 *         description: Control not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get control
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
 * /controls:
 *   post:
 *     summary: Creates a new control
 *     tags: [Controls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Control'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Control created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Control'
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
 *         description: Failed to create control
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
 * /controls/{id}:
 *   patch:
 *     summary: Updates an existing control
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The control ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Control'
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Control updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Control'
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
 *         description: Control not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update control
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
 * /controls/{id}:
 *   delete:
 *     summary: Deletes a control
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The control ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Control deleted successfully
 *       404:
 *         description: Control not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete control
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
 * /catalogs/{catalogId}/controls:
 *   get:
 *     summary: Retrieves all controls for a catalog
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: catalogId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The catalog ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of controls for the catalog
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Control'
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
 *         description: Failed to get controls for catalog
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
 * /controls/{id}/panels:
 *   get:
 *     summary: Retrieve panels by control ID
 *     tags: [Controls Panel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The control ID to retrieve panels for
 *     responses:
 *       200:
 *         description: A list of panels for the specified control ID
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   controlId:
 *                     type: integer
 *                   name:
 *                     type: string
 *       500:
 *         description: Failed to retrieve panels
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
 * /controls/{id}/panel/{panelId}:
 *   post:
 *     summary: Add a panel to a control
 *     tags: [Controls Panel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The control ID to which the panel will be added
 *       - in: path
 *         name: panelId
 *         schema:
 *           type: string
 *         required: true
 *         description: The panel ID to add
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               dashboardUid:
 *                 type: string
 *     responses:
 *       201:
 *         description: Panel added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     controlId:
 *                       type: integer
 *                     name:
 *                       type: string
 *       500:
 *         description: Failed to add panel to control
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
 * /controls/{id}/panels/{panelId}:
 *   delete:
 *     summary: Delete a specific panel from a control
 *     tags: [Controls Panel]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The control ID from which the panel will be deleted
 *       - in: path
 *         name: panelId
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the panel to delete
 *     responses:
 *       204:
 *         description: Panel deleted successfully
 *       404:
 *         description: Panel not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete panel
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
