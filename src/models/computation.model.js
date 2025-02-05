import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Computation = sequelize.define(
  'Computation',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    computationGroup: {
      type: DataTypes.UUID,
      allowNull: true,
    },
    value: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    scope: {
      type: DataTypes.JSON,
      allowNull: true,
    },
    evidences: {
      type: DataTypes.ARRAY(DataTypes.JSON),
      allowNull: true,
    },
    period: {
      type: DataTypes.JSON,
      allowNull: true,
    }
  },
  {
    tableName: 'computation',
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
 *         computationGroup:
 *           type: string
 *           format: uuid
 *           description: The group identifier for the computation
 *         value:
 *           type: boolean
 *           description: The result of the computation (true or false)
 *         scope:
 *           type: object
 *           description: The scope or context where the computation is applied
 *         evidences:
 *           type: array
 *           items:
 *             type: object
 *           description: Evidence or supporting data for the computation
 *         period:
 *           type: object
 *           description: The period during which the computation is valid
 *       required:
 *         - value
 *         - scope
 *         - evidences
 *       example:
 *         id: d290f1ee-6c54-4b01-90e6-d701748f0851
 *         computationGroup: 123e4567-e89b-12d3-a456-426614174000
 *         value: true
 *         scope: {"project": "showcase-GH-governify_bluejay-showcase", "class": "showcase", "member": "Javi_Fdez" }
 *         evidences: [{"document": "Document confirming the computation"}]
 *         period: { "from": "2022-04-07T02:00:00.000Z", "to": "2022-04-07T02:59:59.999Z" }
 *         control_id: 2
 */
