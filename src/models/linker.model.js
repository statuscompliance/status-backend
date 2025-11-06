import { DataTypes, UUIDV4 } from 'sequelize';

export default (sequelize) => sequelize.define('Linker', {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true,
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true,
    comment: 'Human-readable name for the linker'
  },
  defaultMethodName: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: 'default',
    comment: 'Default method name to use when fetching from datasources'
  },
  datasourceIds: {
    type: DataTypes.JSON,
    allowNull: false,
    comment: 'Array of datasource IDs referenced by this linker',
    validate: {
      isValidArray(value) {
        if (!Array.isArray(value)) {
          throw new Error('datasourceIds must be an array');
        }
        if (value.length === 0) {
          throw new Error('datasourceIds must contain at least one datasource ID');
        }
      }
    }
  },
  datasourceConfigs: {
    type: DataTypes.JSON,
    allowNull: true,
    comment: 'Configuration map for each datasource including method configs and property mappings',
    validate: {
      isValidConfig(value) {
        if (value !== null && typeof value !== 'object') {
          throw new Error('datasourceConfigs must be an object or null');
        }
      }
    }
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
    comment: 'Optional description of what this linker does'
  },
  environment: {
    type: DataTypes.STRING(20),
    allowNull: false,
    defaultValue: 'production',
    comment: 'Environment where this linker is used (production, staging, dev)'
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: true,
    comment: 'Whether this linker is active and can be used'
  },
  createdBy: {
    type: DataTypes.STRING(100),
    allowNull: false,
    comment: 'Username of the creator'
  },
  version: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1,
    comment: 'Version number, incremented on config changes'
  },
  lastExecutedAt: {
    type: DataTypes.DATE,
    allowNull: true,
    comment: 'Last time this linker was executed'
  },
  executionStatus: {
    type: import.meta.env?.VITEST ? DataTypes.STRING(50) : DataTypes.ENUM('success', 'failure', 'pending', 'not_executed'),
    allowNull: false,
    defaultValue: 'not_executed'
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
    onDelete: 'CASCADE',
    comment: 'User ID of the owner'
  }
}, {
  tableName: 'linkers',
  timestamps: true,
  indexes: [
    {
      unique: true,
      fields: ['name', 'ownerId'],
      name: 'linkers_name_owner_unique'
    },
    {
      fields: ['environment']
    },
    {
      fields: ['isActive']
    },
    {
      fields: ['ownerId']
    }
  ]
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Linker:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the linker
 *         name:
 *           type: string
 *           description: Human-readable name for the linker
 *         defaultMethodName:
 *           type: string
 *           default: default
 *           description: Default method name to use when fetching from datasources
 *         datasourceIds:
 *           type: array
 *           items:
 *             type: string
 *             format: uuid
 *           description: Array of datasource IDs referenced by this linker
 *         datasourceConfigs:
 *           type: object
 *           description: Configuration map for each datasource
 *           additionalProperties:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               methodConfig:
 *                 type: object
 *                 properties:
 *                   methodName:
 *                     type: string
 *                   options:
 *                     type: object
 *               propertyMapping:
 *                 type: object
 *                 additionalProperties:
 *                   type: string
 *         description:
 *           type: string
 *           description: Optional description of what this linker does
 *         environment:
 *           type: string
 *           enum: [production, staging, dev]
 *           default: production
 *           description: Environment where this linker is used
 *         isActive:
 *           type: boolean
 *           default: true
 *           description: Whether this linker is active and can be used
 *         createdBy:
 *           type: string
 *           description: Username of the creator
 *         version:
 *           type: integer
 *           description: Version number, incremented on config changes
 *         lastExecutedAt:
 *           type: string
 *           format: date-time
 *           description: Last time this linker was executed
 *         executionStatus:
 *           type: string
 *           enum: [success, failure, pending, not_executed]
 *           default: not_executed
 *           description: Status of the last execution
 *         createdAt:
 *           type: string
 *           format: date-time
 *         updatedAt:
 *           type: string
 *           format: date-time
 *         ownerId:
 *           type: integer
 *           description: User ID of the owner
 *       required:
 *         - datasourceIds
 *         - createdBy
 *         - ownerId
 */
