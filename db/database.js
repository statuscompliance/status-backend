import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
	dialect: process.env.DB_DIALECT,
	host: process.env.DB_HOST,
	port: process.env.DB_PORT,
	username: process.env.DB_USER,
	password: process.env.DB_PASSWORD,
	database: process.env.DB_NAME,
  sync: { force: true },
  dialectOptions: process.env.DB_CONFIG,
  logging: console.log
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
  
// DROP AND CREATE THE DATABASE

// sequelize.sync()
//   .then(() => {
//       console.log('Database synchronized');
//   })
//   .catch(err => {
//       console.error('Error synchronizing database:', err);
//   });

export default sequelize;
