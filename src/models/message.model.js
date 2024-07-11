import { DataTypes } from "sequelize";
import sequelize from "../../db/database.js";

const Message = sequelize.define("Message", {
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
});

export default Message;

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
