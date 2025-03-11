import { Router } from 'express';
import { 
  getPoints, 
  getPointById, 
  deletePointById,
  getPointsByAgreementId,
  deleteAllPoints
} from '../controllers/point.controller';

const router = Router();

router.get('', getPoints);
router.delete('', deleteAllPoints);
router.get('/:id', getPointById);
router.delete('/:id', deletePointById);
router.get('/catalog/:tpaId', getPointsByAgreementId);

export default router;



/**
 * @swagger
 * tags:
 *   name: Points
 *   description: Grafana data management
 */

/**
 * @swagger
 * /point:
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
 * /point/{id}:
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
 * /point/catalog/{tpaId}:
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