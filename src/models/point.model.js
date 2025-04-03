import { DataTypes, UUIDV4 } from 'sequelize';

export default (sequelize) => sequelize.define('Point', {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true
  },
  agreementId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guaranteeId: {
    type: DataTypes.STRING,
    allowNull: false
  },
  guaranteeValue: {
    type: DataTypes.FLOAT,
    allowNull: false
  },
  guaranteeResult: {
    type: DataTypes.BOOLEAN,
    allowNull: false
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false
  },
  metrics: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  scope: {
    type: DataTypes.JSONB,
    allowNull: false
  },
  computationGroup: {
    type: DataTypes.UUID,
    allowNull: true
  },
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Point:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the point
 *         agreementId:
 *           type: string
 *           description: Identifier for the agreement
 *         guaranteeId:
 *           type: string
 *           description: Identifier for the guarantee
 *         guaranteeValue:
 *           type: number
 *           format: float
 *           description: Value of the guarantee
 *         guaranteeResult:
 *           type: boolean
 *           description: Result of the guarantee
 *         timestamp:
 *           type: string
 *           format: date-time
 *           description: Timestamp of the point
 *         metrics:
 *           type: object
 *           description: Metrics associated with the point
 *         scope:
 *           type: object
 *           description: Scope of the point
 *         computationGroup:
 *           type: string
 *           format: uuid
 *           description: Identifier for the computation group
 */
