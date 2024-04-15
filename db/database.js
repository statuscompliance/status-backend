import { Sequelize } from 'sequelize';

const sequelize = new Sequelize({
	dialect: 'mysql',
	host: 'localhost',
	port: 3306,
	username: 'root',
	password: '',
	database: 'statusdb',
  sync: { force: true }
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
