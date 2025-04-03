import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
export let sequelize;
import { initModels } from '../models/models.js';

const getPostgresConfig = async  () => {
  const sequelize = new Sequelize({
    dialect: 'postgres',
    port: process.env.DB_PORT || 5432,
    host: process.env.DB_HOST || 'localhost',
    username: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'root',
    database: process.env.DB_NAME || 'statusdb',
    ssl: false,
    logging: false,
  });
  console.info('[database] Connecting to Postgres...');
  await sequelize.authenticate();
  console.info('[database] Postgres successfully connected.');
  return sequelize;
}

const initMongoDB = async () => {
  try {
    await mongoose.connect(
      process.env.MONGO_URI || 'mongodb://root:root@localhost:27017/statusdb?authSource=admin'
    );
    console.log('[database] MongoDB connected');
  } catch (err) {
    console.error('[database] MongoDB connection error:', err.message);
  }
};

const initDB = async () => {
  await initMongoDB();
  return await getPostgresConfig();
};

export const registerDB = async (instance) => {
  if(!sequelize) {
    sequelize = instance;
    await initModels(sequelize);
  }
}

if (!import.meta.env?.VITEST) {
  await registerDB(await initDB());
}
