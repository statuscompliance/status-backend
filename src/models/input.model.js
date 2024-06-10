import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Input = sequelize.define('Input', {
    name: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('STRING', 'NUMBER'),
      allowNull: false
    }
}, {
  tableName: 'input',
  timestamps: false
});

export default Input;

/**
 * @swagger
 * components:
 *   schemas:
 *     Input:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the input
 *         type:
 *           type: string
 *           enum: [STRING, NUMBER]
 *           description: The type of the input
 *       required:
 *         - name
 *         - type
 *       example:
 *         name: Age
 *         type: NUMBER
 */
