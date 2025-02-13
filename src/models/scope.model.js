import { DataTypes, UUIDV4 } from 'sequelize';
import sequelize from '../../db/database.js';

const Scope = sequelize.define('Scope', {
  id: {
    type: DataTypes.UUID,
    defaultValue: UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
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
  default : {
    type: DataTypes.STRING,
    allowNull: false
  },
  key: {
    type: DataTypes.VIRTUAL,
    get() {
      return this.name.toLowerCase().replace(/\s+/g, '_');
    },
    allowNull: true
  }
});

export default Scope;

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
