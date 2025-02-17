import { DataTypes } from 'sequelize';
import sequelize from '../db/database.js';

const Configuration = sequelize.define('Configuration', {
  endpoint: {
    type: DataTypes.STRING(50),
    allowNull: false,
  },
  available: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  limit: {
    type: DataTypes.INTEGER,
    allowNull: true,
    defaultValue: 1,
  },
});

export default Configuration;

/**
 * Configuration model.
 * @swagger
 * components:
 *   schemas:
 *     Configuration:
 *       type: object
 *       properties:
 *         endpoint:
 *           type: string
 *           description: The endpoint of the configuration
 *         available:
 *           type: boolean
 *           description: The availability status of the endpoint
 *         limit:
 *           type: integer
 *           description: The limit of assistants (optional)
 *       required:
 *         - endpoint
 *         - available
 *       example:
 *         endpoint: "/api/assistant"
 *         available: true
 *         limit: 1
 */
