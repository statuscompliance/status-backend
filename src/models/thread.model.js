import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';
  
// Definir el modelo Thread
const Thread = sequelize.define('Thread', {
    gpt_id: {
    type: DataTypes.STRING(50),
    allowNull: false
    },
    name: {
    type: DataTypes.STRING(100),
    allowNull: false
    },
    run_id: {
    type: DataTypes.STRING(50),
    allowNull: false
    }
});

export default Thread;