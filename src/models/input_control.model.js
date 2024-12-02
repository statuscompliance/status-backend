import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const InputControl = sequelize.define(
  'InputControl',
  {
    value: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    input_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
  },
  {
    tableName: 'input_control',
    timestamps: false,
  }
);

export default InputControl;

/**
 * @swagger
 * components:
 *   schemas:
 *     InputControl:
 *       type: object
 *       properties:
 *         value:
 *           type: string
 *           description: The value of the input control
 *       required:
 *         - value
 *       example:
 *         value: "Example Value"
 */
