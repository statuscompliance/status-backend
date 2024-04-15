import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';
  
// Definir el modelo User
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING(60),
        allowNull: false
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    authority: {
        type: DataTypes.ENUM('ADMIN', 'DEVELOPER', 'USER'),
        allowNull: false
    },
    email: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    refresh_token: {
        type: DataTypes.STRING(255)
    }
});

export default User;