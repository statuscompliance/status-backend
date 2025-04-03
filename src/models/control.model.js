import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define(
  'Control',
  {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    period: {
      // TODO: Track https://github.com/oguimbal/pg-mem/issues/443 to remove this workaround
      type: import.meta.env?.VITEST ? DataTypes.STRING(50) : DataTypes.ENUM('HOURLY', 'DAILY', 'WEEKLY', 'MONTHLY', 'ANNUALLY'),
      allowNull: false,
    },
    startDate: {
      type: DataTypes.DATE,
    },
    endDate: {
      type: DataTypes.DATE,
    },
    mashupId: {
      type: DataTypes.STRING(32),
      allowNull: false,
    },
    params: {
      type: DataTypes.JSONB,
      allowNull: true
    },
  },
  {
    tableName: 'control',
    timestamps: false,
  }
);

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
 *       required:
 *         - name
 *         - description
 *         - period
 *         - mashupId
 *       example:
 *         name: number of sections is greater than 10
 *         description: The document has more than 10 sections
 *         period: MONTHLY
 *         startDate: 2023-01-01T00:00:00.000Z
 *         endDate: 2023-12-31T23:59:59.000Z
 *         mashupId: abc123
 *         params: { "threshold": 10 }
 */
