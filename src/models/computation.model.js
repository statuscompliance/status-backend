import { DataTypes } from "sequelize";
import sequelize from "../../db/database.js";

const Computation = sequelize.define(
    "Computation",
    {
        id: {
            type: DataTypes.UUID,
            defaultValue: DataTypes.UUIDV4,
            primaryKey: true,
        },
        result: {
            type: DataTypes.BOOLEAN,
            allowNull: false,
        },
        scope: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        evidence: {
            type: DataTypes.STRING,
            allowNull: false,
        },
        start_compute: {
            type: DataTypes.DATE,
            allowNull: true,
        },
        end_compute: {
            type: DataTypes.DATE,
            allowNull: true,
        },
    },
    {
        tableName: "computation",
        timestamps: true,
    }
);

export default Computation;

/**
 * @swagger
 * components:
 *   schemas:
 *     Computation:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           format: uuid
 *           description: The unique identifier for the computation
 *         result:
 *           type: boolean
 *           description: The result of the computation (true or false)
 *         scope:
 *           type: string
 *           description: The scope or context where the computation is applied
 *         evidence:
 *           type: string
 *           description: Evidence or supporting data for the computation
 *       required:
 *         - result
 *         - scope
 *         - evidence
 *       example:
 *         id: d290f1ee-6c54-4b01-90e6-d701748f0851
 *         result: true
 *         scope: project4129
 *         evidence: Document confirming the computation
 */
