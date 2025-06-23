import 'dotenv/config';
import { readdir } from 'node:fs/promises';
import { join } from 'node:path';
import mongoose from 'mongoose';
import { getSequelize } from '../src/db/database.js';
import logger, { initLogDB } from '../src/config/logger.js';

const runPopulators = async () => {
  // Inicializar la conexión para los logs si es necesario
  await initLogDB();
  
  logger.info('[SYSTEM INITIALIZATION] Starting database population sequence');
  
  const populators = await readdir(join(import.meta.dirname, 'populators'));
  for (const populatorsFile of populators) {
    logger.info(`[POPULATOR EXECUTION] Running data initialization module: ${populatorsFile}`);
    await import(`./populators/${populatorsFile}`);
  }
  
  // Close the database connections
  const sequelize = getSequelize();
  sequelize.close();
  mongoose.connection.close();
  logger.info('[SYSTEM INITIALIZATION] Database population sequence completed | Connections closed');
}

await runPopulators();
