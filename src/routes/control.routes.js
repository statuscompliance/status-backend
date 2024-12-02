import { Router } from 'express';
import {
  getControls,
  getControl,
  getCatalogControls,
  getInputControlsByControlId,
  createControl,
  updateControl,
  deleteControl,
  deleteInputControlsByControlId,
  addPanelToControl,
  getPanelsByControlId,
  deletePanelFromControl,
} from '../controllers/control.controller.js';

const router = Router();

// Controls
router.get('/controls', getControls);
router.get('/controls/:id', getControl);
router.post('/controls', createControl);
router.patch('/controls/:id', updateControl);
router.delete('/controls/:id', deleteControl);

router.get('/controls/:id/panels', getPanelsByControlId);
router.post('/controls/:id/panel/:panelId', addPanelToControl);
router.delete('/controls/:id/panels/:panelId', deletePanelFromControl);

// Catalog controls
router.get('/catalogs/:catalog_id/controls', getCatalogControls);

// Input_controls
router.get('/controls/:id/input_controls', getInputControlsByControlId);
router.delete('/controls/:id/input_controls', deleteInputControlsByControlId);

export default router;

/**
 * @swagger
 * tags:
 *   name: Controls
 *   description: Control management
 */

/**
 * @swagger
 * /api/controls:
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
 * /api/controls/{id}:
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
 * /api/controls:
 *   post:
 *     summary: Creates a new control
 *     tags: [Controls]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the control
 *                 example: number of sections is greater than 10
 *               description:
 *                 type: string
 *                 description: The description of the control
 *                 example: The document has more than 10 sections
 *               period:
 *                 type: string
 *                 enum: [DAILY, MONTHLY, ANNUALLY]
 *                 description: The period of the control
 *                 example: MONTHLY
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date of the control
 *                 example: 2023-01-01T00:00:00.000Z
 *               endDate:
 *                 type: string
 *                 format: date-time
 *                 description: The end date of the control
 *                 example: 2023-12-31T23:59:59.000Z
 *               mashup_id:
 *                 type: integer
 *                 description: The ID of the mashup associated with the control
 *                 example: 1
 *               catalog_id:
 *                 type: integer
 *                 description: The ID of the catalog associated with the control
 *                 example: 1
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       201:
 *         description: Control created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                 name:
 *                   type: string
 *                 description:
 *                   type: string
 *                 period:
 *                   type: string
 *                   enum: [DAILY, MONTHLY, ANNUALLY]
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 mashup_id:
 *                   type: integer
 *                 catalog_id:
 *                   type: integer
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
 * /api/controls/{id}:
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
 * /api/controls/{id}:
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
 * /api/catalogs/{catalog_id}/controls:
 *   get:
 *     summary: Retrieves all controls for a catalog
 *     tags: [Controls]
 *     parameters:
 *       - in: path
 *         name: catalog_id
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
 * /api/controls/{id}/input_controls:
 *   get:
 *     summary: Retrieves input controls for a control
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
 *         description: A list of input controls for the control
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/InputControl'
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
 *         description: Failed to get input controls for control
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
 * /api/controls/{id}/input_controls:
 *   delete:
 *     summary: Deletes input controls by control ID
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
 *         description: Input controls deleted successfully
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
 *         description: Failed to delete input controls
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
 * /api/controls/{id}/panels:
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
 *                   control_id:
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
 * /api/controls/{id}/panel/{panelId}:
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
 *                     control_id:
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
 * /api/controls/{id}/panels/{panelId}:
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
