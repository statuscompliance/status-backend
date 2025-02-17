import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const Catalog = sequelize.define('Catalog', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE,
    allowNull: false
  },
  endDate: {
    type: DataTypes.DATE,
    allowNull: true
  },
  dashboard_id: {
    type: DataTypes.STRING(32),
    allowNull: true
  },
  tpaId: {
    type: DataTypes.STRING(40),
    allowNull: true
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
 *         dashboard_id:
 *           type: string
 *           description: The ID of the dashboard associated with the catalog
 *         tpaId:
 *           type: string
 *           description: The ID of the agreement associated with the catalog
 *       required:
 *         - name
 *       example:
 *         name: Documents
 *         startDate: 2024-06-01T00:00:00.000Z
 *         endDate: 2024-08-31T23:59:59.000Z
 *         dashboard_id: ae08pn1m04lxcd
 *         tpaId: tpa-aefe3b50-22cb-4a5b-88c5-66f236bfdeca
 */