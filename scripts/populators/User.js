import bcrypt from 'bcrypt';
import { models } from '../../src/models/models.js';
import logger from '../../src/config/logger.js';

async function populateUsers() {
  try {
    logger.info('[DATA INITIALIZATION] Starting user accounts population process');

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
        logger.info(`[USER CREATED] Account "${userData.username}" with role "${userData.authority}" successfully initialized`);
      } else {
        logger.info(`[USER SKIPPED] Account "${userData.username}" already exists in the system`);
      }
    }
    logger.info('[DATA INITIALIZATION] User accounts population process completed successfully');
  } catch (error) {
    logger.error('[DATA INITIALIZATION ERROR] Failed to populate user accounts', { error, stack: error.stack });
  }
}

await populateUsers();
