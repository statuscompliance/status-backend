import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { Sequelize } from 'sequelize';
import { newDb } from 'pg-mem';
import { registerDB } from '../../src/db/database';

let mongoServer;
export let sequelize;

export const connect = async () => {
  await registerDB(await initPostgres());
  await initMongoDB();
};

export const closeDatabase = async () => {
  // Close MongoDB connection and stop server
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer?.stop();
    console.log('[database] In-memory MongoDB closed');
  }

  // Close the SQLite (Sequelize) connection
  if (sequelize) {
    await sequelize.close();
    console.log('[database] In-memory SQLite (PG mem) closed');
  }
};

export const clearDatabase = async () => {
  // Clear MongoDB collections
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany();
    })
  );
  console.log('[database] In-memory MongoDB cleared');

  // Clear SQLite data by re-syncing the models
  if (sequelize) {
    await sequelize.sync({ force: true });
    console.log('[database] In-memory SQLite (PG mem) cleared');
  }
};

async function initMongoDB() {
  const mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri());
  console.log('[database] In-memory MongoDB connected');
}

async function initPostgres() {
  const pgMem = newDb();
  pgMem.public.registerFunction({
    name: 'current_database',
    returns: 'text',
    implementation: () => 'pg-mem',
  });
  const adapter = pgMem.adapters.createPg();

  sequelize = new Sequelize('postgres://user:pass@localhost:5432/dbname', {
    dialect: 'postgres',
    logging: false,
    dialectModule: adapter,
  });

  await sequelize.sync({ force: true });
  await sequelize.authenticate();
  console.log('[database] In-memory SQLite (PG mem) connected');
  return sequelize;
}