import bcrypt from 'bcrypt';
import { models } from '../../src/models/models.js';

async function populateUsers() {
  try {
    console.log('__________________________________');
    console.log('Starting user population...');
    console.log('__________________________________');

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
      const [, created] = await models.User.findOrCreate({
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
    console.log('__________________________________');
  } catch (error) {
    console.error('Error during user population:', error);
  }
}

await populateUsers();
