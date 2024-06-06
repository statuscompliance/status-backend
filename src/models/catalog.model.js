import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Catalog = sequelize.define('Catalog', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  startDate: {
    type: DataTypes.DATE
  },
  endDate: {
    type: DataTypes.DATE
  }
}, {
  tableName: 'catalog',
  timestamps: false
});

export default Catalog;
