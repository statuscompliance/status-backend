import { closeDatabase } from './database';

export default async function globalTeardown() {
  console.log('[globalTeardown] Closing database connections...');
  await closeDatabase();
  console.log('[globalTeardown] Database connections closed.');
}
