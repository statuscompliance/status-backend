import { pool } from '../src/db.js';
import fs from 'fs';

fs.readFile('db/database.sql', 'utf8', async (err, data) => {
  if (err) {
    console.error('Error reading SQL file:', err);
    return;
  }

  const queries = data.split(';').filter(query => query.trim() !== '');

  try {
    const connection = await pool.getConnection();

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      await connection.query(query);
    }

    connection.release();
    console.log('DONE');
  } catch (error) {
    console.error('Error when executing queries:', error);
  }
});
