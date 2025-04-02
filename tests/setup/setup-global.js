import { connect } from './database';

export default async function globalSetup() {
  console.log('[globalSetup] Connecting to databases...');
  await connect();
  console.log('[globalSetup] Databases connected.');
}
