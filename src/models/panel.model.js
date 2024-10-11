import { DataTypes, UUIDV4 } from "sequelize";
import sequelize from "../../db/database.js";

const Panel = sequelize.define(
    "Panel",
    {
        id: {
            type: DataTypes.STRING,
            primaryKey: true,
            defaultValue: UUIDV4,
        },
    },
    {
        tableName: "panel",
        timestamps: false,
    }
);

export default Panel;

/**
 * @swagger
 * components:
 *  schemas:
 *    Panel:
 *      type: object
 *      properties:
 *        id:
 *          type: string
 *          description: The unique identifier for the panel (UUID)
 *      required:
 *        - id
 *      example:
 *        id: "e9c7d71c-90b3-4c1c-bd84-3f1c73392b3c"
 */
