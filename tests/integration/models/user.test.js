import { expect, describe, it, beforeAll } from 'vitest';
import { models } from '../../../src/models/models.js';
import bcrypt from 'bcrypt';

describe('User models', () => {
  describe('User creation', () => {
    let createdUser;
    const testUser = {
      username: 'testuser',
      password: 'password123',
      authority: 'USER',
      email: 'test@example.com'
    };

    beforeAll(async () => {
      await models.User.destroy({
        where: { 
          username: testUser.username,
          email: testUser.email 
        }
      });
    });

    it('should create a user correctly in the database', async () => {
      const hashedPassword = await bcrypt.hash(testUser.password, 10);
      
      createdUser = await models.User.create({
        username: testUser.username,
        password: hashedPassword,
        authority: testUser.authority,
        email: testUser.email
      });
      const passwordMatch = await bcrypt.compare(testUser.password, createdUser.password);
      
      expect(createdUser).toBeDefined();
      expect(createdUser.id).toBeDefined();
      expect(createdUser.username).toBe(testUser.username);
      expect(createdUser.authority).toBe(testUser.authority);
      expect(createdUser.email).toBe(testUser.email);
      expect(passwordMatch).toBe(true);
    });

    it('should retrieve the created user from the database', async () => {
      const retrievedUser = await models.User.findOne({
        where: { username: testUser.username }
      });

      expect(retrievedUser).toBeDefined();
      expect(retrievedUser.id).toBe(createdUser.id);
      expect(retrievedUser.username).toBe(testUser.username);
      expect(retrievedUser.authority).toBe(testUser.authority);
      expect(retrievedUser.email).toBe(testUser.email);
    });
  });
});
