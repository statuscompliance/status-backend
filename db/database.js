import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
	dialect: process.env.DB_DIALECT,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
  dialectOptions: process.env.DB_CONFIG,
  logging: false // Disable logging - Add console.log to see the queries
});

// Test connection
console.info('SETUP - Connecting database...')

sequelize.authenticate()
  .then(() => {
    console.info('INFO - Database connected.')
  })
  .catch(err => {
    console.error('ERROR - Unable to connect to the database:', err)
  });

export default sequelize;
