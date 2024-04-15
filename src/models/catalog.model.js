import { DataTypes } from 'sequelize';
import sequelize from '../../db/database.js';

const Catalog = sequelize.define('Catalog', {
  name: {
    type: DataTypes.STRING(100),
    allowNull: false
  },
  url: {
    type: DataTypes.STRING(255)
  }
});

export default Catalog;
