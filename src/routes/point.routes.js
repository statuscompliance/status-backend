import { Router } from 'express';
import { 
  getPoints, 
  getPointById, 
  deletePointById,
  getPointsByAgreementId,
  deleteAllPoints,
  updatePointByComputationGroup
} from '../controllers/point.controller';

export default function () {
  const router = Router();
  router.get('', getPoints);
  router.delete('', deleteAllPoints);
  router.get('/catalog/:tpaId', getPointsByAgreementId); 
  router.get('/:id', getPointById);
  router.delete('/:id', deletePointById);
  router.put('/computationGroup/:computationGroup', updatePointByComputationGroup);

  return router;
}

/**
 * @swagger
 * tags:
 *   name: Points
 *   description: Grafana data management
 */

/**
 * @swagger
 * /points:
 *   get:
 *     summary: Retrieves all points
 *     tags: [Points]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of points
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
 * /points/{id}:
 *   get:
 *     summary: Retrieves a Point by computationGroup
 *     tags: [Points]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description:  The pointId
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single Point
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Point'
 *       404:
 *         description: Point not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get Point
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *   delete:
 *     summary: Deletes a point
 *     tags: [Points]
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The point ID
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       204:
 *         description: 
 *       404:
 *         description: Point not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to delete point
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
 * /points/catalog/{tpaId}:
 *   get:
 *     summary: Retrieves a Point by tpaId
 *     tags: [Points]
 *     parameters:
 *       - in: path
 *         name: tpaId
 *         schema:
 *           type: string
 *         required: true
 *         description:  The pointId
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A single Point
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Point'
 *       404:
 *         description: Point not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to get Point
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
 * /points/computationGroup/{computationGroup}:
 *   put:
 *     summary: Updates points by computation group ID
 *     tags: [Points]
 *     parameters:
 *       - in: path
 *         name: computationGroup
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: The computation group ID
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               guaranteeValue:
 *                 type: number
 *                 format: float
 *               guaranteeResult:
 *                 type: boolean
 *               metrics:
 *                 type: object
 *               scope:
 *                 type: object
 *     responses:
 *       200:
 *         description: Points updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 points:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Point'
 *       400:
 *         description: Invalid computation group ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       404:
 *         description: No points found with the specified computation group
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       500:
 *         description: Failed to update points
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 */
