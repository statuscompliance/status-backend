import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
  dialect: 'postgres',
  port: process.env.DB_PORT || 5432,
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'statusdb',
  ssl: false,
  logging: false, // Disable logging - Add console.log to see the queries
});

// Test connection
console.info('[database] Connecting...');

sequelize.authenticate().then(() => {
  console.info('[database] Successully connected.');
});

export default sequelize;
