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
