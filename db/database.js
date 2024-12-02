import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: process.env.DB_DIALECT || 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'statusdb',
  dialectOptions: process.env.DB_CONFIG || {},
  logging: false, // Disable logging - Add console.log to see the queries
});

// Test connection
console.info('SETUP - Connecting database...');

sequelize.authenticate().then(() => {
  console.info('INFO - Database connected.');
});

export default sequelize;
