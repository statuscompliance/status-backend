import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const InputControl = sequelize.define('InputControl', {
    value: {
      type: DataTypes.STRING(255),
      allowNull: false
    }
});
  
export default InputControl;
  