import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define('Secret', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    allowNull: false,
    autoIncrement: !import.meta.env?.VITEST,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  type: {
    type: DataTypes.STRING(50), // ej. 'API_KEY', 'TOKEN'
    allowNull: false
  },
  environment: {
    type: DataTypes.STRING(20), // ej. 'production', 'dev'
    allowNull: false,
    defaultValue: 'production'
  },
  valueEncrypted: {
    type: DataTypes.TEXT,
    allowNull: false
  },
  createdBy: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1
  },
  rotatedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  updatedAt: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  ownerId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    },
    onDelete: 'CASCADE'
  }
}, {
  tableName: 'secrets',
  timestamps: true
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Secret:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the secret
 *         type:
 *           type: string
 *           description: The type of the secret (e.g. API_KEY, TOKEN)
 *         environment:
 *           type: string
 *           description: The environment for this secret (e.g. production, staging)
 *         valueEncrypted:
 *           type: string
 *           description: The encrypted value of the secret (never shown in full)
 *         createdBy:
 *           type: string
 *           description: User or system who created this secret
 *         version:
 *           type: integer
 *           description: The version number of this secret (for rotation)
 *         rotatedAt:
 *           type: string
 *           format: date-time
 *           description: When the secret was last rotated
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         ownerId:
 *           type: integer
 *           description: User id
 *       required:
 *         - name
 *         - type
 *         - environment
 *         - valueEncrypted
 *         - createdBy
 */
