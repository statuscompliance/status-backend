import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Catalog = sequelize.define('Catalog', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE
  },
  endDate: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'catalog',
  timestamps: false
});

export default Catalog;

/**
 * @swagger
 * components:
 *   schemas:
 *     Catalog:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the catalog
 *         startDate:
 *           type: string
 *           format: date-time
 *           description: The start date of the catalog
 *         endDate:
 *           type: string
 *           format: date-time
 *           description: The end date of the catalog
 *       required:
 *         - name
 *       example:
 *         name: Documents
 *         startDate: 2024-06-01T00:00:00.000Z
 *         endDate: 2024-08-31T23:59:59.000Z
 */
