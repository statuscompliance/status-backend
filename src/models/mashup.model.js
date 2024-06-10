import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Mashup = sequelize.define('Mashup', {
    name: {
      type: DataTypes.STRING(100),
      allowNull: false
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: false
    },
    url: {
      type: DataTypes.STRING(255)
    }
}, {
  tableName: 'mashup',
  timestamps: false
});

export default Mashup;

/**
 * @swagger
 * components:
 *   schemas:
 *     Mashup:
 *       type: object
 *       properties:
 *         name:
 *           type: string
 *           description: The name of the mashup
 *         description:
 *           type: string
 *           description: The description of the mashup
 *         url:
 *           type: string
 *           description: The URL of the mashup
 *       required:
 *         - name
 *         - description
 *         - url
 *       example:
 *         name: Exists Document
 *         description: Verifies the existence of a document
 *         url: src/pages/catalog/mashup-example.json
 */