import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

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
console.info('[database] Connecting to Postgres...');

sequelize.authenticate().then(() => {
  console.info('[database] Postgres successully connected.');
});

mongoose
  .connect(process.env.MONGO_URI || 'mongodb://root:root@localhost:27017/statusdb?authSource=admin')
  .then(() => console.log('[database] MongoDB connected'))
  .catch((err) => console.log('[database] MongoDB connection error:', err.message));

export default sequelize;
