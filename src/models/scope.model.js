import { DataTypes, UUIDV4 } from 'sequelize';

export default (sequelize) => sequelize.define('Scope', {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    validate: {
      isLowercaseUnderscore(value) {
        if (value !== value.toLowerCase().replace(/\s+/g, '_')) {
          throw new Error('Name must be in lowercase and spaces replaced with underscores');
        }
      }
    }
  },
  description: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    defaultValue: 'string',
    allowNull: false
  },
  default: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

/**
 * @swagger
 * components:
 *   schemas:
 *     Scope:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: Unique identifier for the scope
 *         name:
 *           type: string
 *           description: Name of the scope
 *         description:
 *           type: string
 *           description: Description of the scope
 *         type:
 *           type: string
 *           description: Type of the scope
 *         default:
 *           type: string
 *           description: Default value of the scope
 */
