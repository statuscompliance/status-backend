import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const Assistant = sequelize.define('Assistant', {
  assistantId: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  instructions: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  tools: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  model: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
    defaultValue: 'INACTIVE',
  },
});

export default Assistant;

/**
 * @swagger
 * components:
 *   schemas:
 *      Assistant:
 *       type: object
 *       required:
 *         - assistantId
 *         - name
 *         - instructions
 *         - tools
 *         - model
 *       properties:
 *         assistantId:
 *           type: string
 *           description: The ID of the assistant
 *         name:
 *           type: string
 *           description: The name of the assistant
 *         instructions:
 *           type: string
 *           description: The instructions for the assistant
 *         tools:
 *           type: string
 *           description: The tools used by the assistant
 *         model:
 *           type: string
 *           description: The model of the assistant
 *         status:
 *           type: string
 *           enum:
 *             - ACTIVE
 *             - INACTIVE
 *           default: INACTIVE
 *           description: The status of the assistant
 *       example:
 *         assistantId: "asst_12ejasdasd11d21"
 *         name: "Example Assistant"
 *         instructions: "These are the instructions for the assistant"
 *         tools: "[{type:'code_interpreter'}]"
 *         model: "gpt-3.5-turbo-0125"
 *         status: "INACTIVE"
 */
