import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Message = sequelize.define('Message', {
  content: {
    type: DataTypes.TEXT,
    allowNull: false
  }
});

export default Message;