import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Input = sequelize.define('Input', {
    name: {
      type: DataTypes.STRING(60),
      allowNull: false
    },
    type: {
      type: DataTypes.ENUM('STRING', 'NUMBER'),
      allowNull: false
    }
}, {
  tableName: 'input',
  timestamps: false
});

export default Input;