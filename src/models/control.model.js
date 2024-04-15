import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Control = sequelize.define('Control', {
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: false
    },
    period: {
        type: DataTypes.ENUM('DAILY', 'MONTHLY', 'ANNUALLY'),
        allowNull: false
    },
    startDate: {
        type: DataTypes.DATE
    },
    endDate: {
        type: DataTypes.DATE
    }
})

export default Control;