import { DataTypes, UUID, UUIDV4 } from "sequelize";
import sequelize from "../../db/database.js";

const Panel = sequelize.define(
    "Panel",
    {
        uid: {
            type: UUIDV4,
            primaryKey: true,
            allowNull: false,
            defaultValue: UUIDV4,
        },
        id: {
            type: DataTypes.STRING,
            defaultValue: UUIDV4,
        },
        dashboardUid: {
            type: DataTypes.STRING,
            allowNull: true,
            defaultValue: null,
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
 *        dashboardUid:
 *          type: string
 *          description: The unique identifier for the dashboard (UUID)
 *        control_id:
 *          type: integer
 *          description: The unique identifier for the control
 *      required:
 *        - id
 *        - dashboardUid
 *        - control_id
 *      example:
 *        id: "e9c7d71c-90b3-4c1c-bd84-3f1c73392b3c"
 */