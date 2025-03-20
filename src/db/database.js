import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { newDb } from 'pg-mem';

let sequelize;

const initPostgres = async () => {
  if (process.env.NODE_ENV === 'test') {
    const pgDb = newDb();
    sequelize = new Sequelize({
      dialect: 'postgres',
      dialectModule: pgDb.adapters.createPg(),
      logging: false,
    });
    console.log('[database] PostgreSQL in-memory connected');

    await sequelize.sync({ force: true });
    await sequelize.authenticate();
  } else {
    sequelize = new Sequelize({
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

    try {
      await sequelize.authenticate();
      console.info('[database] Postgres successfully connected.');
    } catch (error) {
      console.error('[database] Unable to connect to Postgres:', error);
      throw error;
    }
  }
};

const initMongoDB = async () => {
  if (process.env.NODE_ENV === 'test') {
    const mongoServer = await MongoMemoryServer.create();
    await mongoose.connect(mongoServer.getUri());
    console.log('[database] In-memory MongoDB connected');
  } else {
    try {
      await mongoose.connect(
        process.env.MONGO_URI || 'mongodb://root:root@localhost:27017/statusdb?authSource=admin'
      );
      console.log('[database] MongoDB connected');
    } catch (err) {
      console.error('[database] MongoDB connection error:', err.message);
    }
  }
};

const initDB = async () => {
  await initPostgres();
  await initMongoDB();
};

initDB().catch((err) =>
  console.error('[database] Error during database initialization:', err)
);

export default sequelize;
