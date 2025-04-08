import { DataTypes } from 'sequelize';

export default (sequelize) => sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
});

/**
 * Message model.
 * @swagger
 * components:
 *   schemas:
 *     Message:
 *       type: object
 *       properties:
 *         content:
 *           type: string
 *           description: The content of the message
 *       required:
 *         - content
 *       example:
 *         content: "This is a sample message."
 */
