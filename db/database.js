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

      if (query.trim().startsWith('CREATE TABLE')) {
        const tableName = query.match(/CREATE TABLE (\w+)/)[1];
        const tableExistsQuery = `SELECT COUNT(*) AS count FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = '${tableName}'`;
        const [rows] = await connection.query(tableExistsQuery);
        
        // if(tableName === 'User'){
        //     await connection.query(`DROP TABLE USER`); 
        // }

        if (rows[0].count > 0) {
            console.log(`Table '${tableName}' already exists. Skipping creation.`);
            continue;
        }
      }

      await connection.query(query);
    }

    connection.release();
    console.log('DONE');
  } catch (error) {
    console.error('Error when executing queries:', error);
  }
});
