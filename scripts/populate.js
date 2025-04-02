import 'dotenv/config';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { sequelize } from '../src/db/database.js';

const runPopulators = async () => {
  const populators = await readdir(join(import.meta.dirname, 'populators'));
  for (const populatorsFile of populators) {
    await import(`./populators/${populatorsFile}`);
  }
  //Close the database connection
  sequelize.close();
  mongoose.connection.close();
  console.log('[database] Connections closed.');
}

await runPopulators();