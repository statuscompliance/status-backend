import { DataTypes, UUIDV4 } from 'sequelize';

export default (sequelize) => sequelize.define('Datasource', {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  definitionId: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'ID of the DatasourceDefinition used to create this instance'
  },
  config: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Configuration object containing datasource-specific settings'
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  environment: {
    type: DataTypes.STRING(20), // e.g. 'production', 'dev', 'staging'
    allowNull: false,
    defaultValue: 'production'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true
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
  lastTestedAt: {
    type: DataTypes.DATE,
    allowNull: true
  },
  testStatus: {
    type: DataTypes.ENUM('success', 'failure', 'pending', 'not_tested'),
    allowNull: false,
    defaultValue: 'not_tested'
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
  tableName: 'datasources',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'ownerId'],
      name: 'datasources_name_owner_unique'
    },
    {
      fields: ['definitionId']
    },
    {
      fields: ['environment']
    }
  ]
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Datasource:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the datasource
 *         name:
 *           type: string
 *           description: The name of the datasource
 *         definitionId:
 *           type: string
 *           description: ID of the DatasourceDefinition used to create this instance
 *         config:
 *           type: object
 *           description: Configuration object containing datasource-specific settings
 *         description:
 *           type: string
 *           description: Optional description of the datasource
 *         environment:
 *           type: string
 *           description: The environment for this datasource (e.g. production, staging)
 *         isActive:
 *           type: boolean
 *           description: Whether the datasource is active
 *         createdBy:
 *           type: string
 *           description: User or system who created this datasource
 *         version:
 *           type: integer
 *           description: The version number of this datasource
 *         lastTestedAt:
 *           type: string
 *           format: date-time
 *           description: When the datasource was last tested
 *         testStatus:
 *           type: string
 *           enum: [success, failure, pending, not_tested]
 *           description: The status of the last test
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
 *         - definitionId
 *         - config
 *         - createdBy
 */
