import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Configuration = sequelize.define('Configuration', {
    endpoint: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    available: {
        type: DataTypes.BOOLEAN,
        defaultValue: true
    }, 
    limit: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 1
    }
});

export default Configuration;