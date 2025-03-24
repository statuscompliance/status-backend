import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const Control = sequelize.define(
  'Control',
  {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    period: {
      type: DataTypes.ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY'),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
    },
    endDate: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    mashupId: {
      type: DataTypes.STRING(32),
      allowNull: true,
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: true
    },
    status: {
      type: DataTypes.ENUM('draft', 'finalized'),
      defaultValue: 'finalized'
    },
  },
  {
    tableName: 'control',
    timestamps: false,
  }
);

export default Control;

/**
 * @swagger
 * components:
 *   schemas:
 *     Control:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the control
 *         description:
 *           type: string
 *           description: The description of the control
 *         period:
 *           type: string
 *           enum: [HOURLY, DAILY, WEEKLY, MONTHLY, ANNUALLY]
 *           description: The period of the control
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: The start date of the control
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The end date of the control
 *         mashupId:
 *           type: string
 *           description: The mashup ID associated with the control
 *         params:
 *           type: object
 *           description: Input parameters for the control
 *         status:
 *           type: string
 *           enum: [draft, finalized]
 *           description: The status of the control
 *       required:
 *         - name
 *         - description
 *         - period
 *         - mashupId
 *       example:
 *         name: Audit Trail Completeness
 *         description: Verifies that all financial transactions are documented for audit compliance.
 *         period: WEEKLY
 *         startDate: 2023-01-01T00:00:00.000Z
 *         endDate: 2023-12-31T23:59:59.000Z
 *         mashupId: abc123
 *         params: { "threshold": 10, "endpoint": "/bpi" }
 *         status: finalized
 */
