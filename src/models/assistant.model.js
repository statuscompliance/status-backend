import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Assistant = sequelize.define('Assistant', {
    assistantId: {
        type: DataTypes.STRING(50),
        allowNull: false
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    instructions: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    tools: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    model: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('ACTIVE', 'INACTIVE'),
        defaultValue: 'INACTIVE'
    }
});

export default Assistant;