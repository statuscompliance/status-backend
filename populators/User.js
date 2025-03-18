import bcrypt from 'bcrypt';
import User from '../src/models/user.model.js';
import sequelize from '../src/db/database.js';

async function populateUsers() {
  try {
    console.log('Starting user population...');
    // Synchronize the model with the database
    await sequelize.sync({ force: false });

    // Hash passwords before saving them
    const saltRounds = 10;
    const adminPassword = await bcrypt.hash('admin123', saltRounds);
    const devPassword = await bcrypt.hash('dev123', saltRounds);
    const userPassword = await bcrypt.hash('user123', saltRounds);

    // Create users if they don't exist
    const users = [
      {
        username: 'admin',
        password: adminPassword,
        authority: 'ADMIN',
        email: 'admin@example.com',
        refresh_token: null
      },
      {
        username: 'developer',
        password: devPassword,
        authority: 'DEVELOPER',
        email: 'developer@example.com',
        refresh_token: null
      },
      {
        username: 'user',
        password: userPassword,
        authority: 'USER',
        email: 'user@example.com',
        refresh_token: null
      }
    ];

    for (const userData of users) {
      const [, created] = await User.findOrCreate({
        where: { username: userData.username },
        defaults: userData
      });

      if (created) {
        console.log(`User ${userData.username} with role ${userData.authority} successfully created.`);
      } else {
        console.log(`User ${userData.username} already exists.`);
      }
    }

    console.log('User population completed.');
  } catch (error) {
    console.error('Error during user population:', error);
  } finally {
    // Close the database connection
    console.log('Closing database connection...');
    await sequelize.close();
    console.log('Connection closed successfully.');
  }
}

// Execute the population function and ensure it terminates
populateUsers()
  .then(() => {
    console.log('User populator finished successfully.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Fatal error in user population:', error);
    process.exit(1);
  });
