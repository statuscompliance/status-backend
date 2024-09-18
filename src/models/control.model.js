import { DataTypes } from "sequelize";
import sequelize from "../../db/database.js";

const Control = sequelize.define(
    "Control",
    {
        name: {
            type: DataTypes.STRING(100),
            allowNull: false,
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: false,
        },
        period: {
            type: DataTypes.ENUM("DAILY", "MONTHLY", "ANNUALLY"),
            allowNull: false,
        },
        mashup_id: {
            type: DataTypes.STRING(32),
            allowNull: false,
        },
    },
    {
        tableName: "control",
        timestamps: false,
    }
);

export default Control;

/**
 * @swagger
 * components:
 *   schemas:
 *     Control:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the control
 *         description:
 *           type: string
 *           description: The description of the control
 *         period:
 *           type: string
 *           enum: [DAILY, MONTHLY, ANNUALLY]
 *           description: The period of the control
 *       required:
 *         - name
 *         - description
 *         - period
 *       example:
 *         name: number of sections is greater than 10
 *         description: The document has more than 10 sections
 *         period: MONTHLY
 */
