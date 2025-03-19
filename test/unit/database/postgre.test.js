import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { connectPostgreSQL, disconnectPostgreSQL, UserPostgres} from '../../setup/postgreConnection.js';

describe('UserPostgres SCRUD Tests', () => {
  
  beforeAll(async () => {
    await connectPostgreSQL();
   // await sequelize.authenticate();
   await UserPostgres.sync({ force: true }); // Ensure fresh table for testing
  });

  afterAll(async () => {
    await disconnectPostgreSQL();
  });
  it('should connect to PostgreSQL successfully', async () => {
    expect(true).toBe(true); // Add actual checks to verify connection
  });
  
  it('should create a user', async () => {
    const newUser = await UserPostgres.create({ username: 'testUser', password: 'testPass', email: "test@mail.com" });
    expect(newUser).toBeDefined();
    expect(newUser.username).toBe('testUser');
    expect(newUser.password).toBe('testPass');
    expect(newUser.email).toBe('test@mail.com');
  });

  it('should read a user', async () => {
    const user = await UserPostgres.findOne({ where: { username: 'testUser' } });
    expect(user).not.toBeNull();
    expect(user.username).toBe('testUser');
    expect(user.email).toBe('test@mail.com');
  });

  it('should update a user', async () => {
    await UserPostgres.update({ password: 'newPass' }, { where: { username: 'testUser', email: "test@mail.com" } });
    const updatedUser = await UserPostgres.findOne({ where: { username: 'testUser' } });
    expect(updatedUser.username).toBe('testUser');
    expect(updatedUser.password).toBe('newPass');
    expect(updatedUser.email).toBe('test@mail.com');
  });

  it('should delete a user', async () => {
    await UserPostgres.destroy({ where: { username: 'testUser' } });
    const deletedUser = await UserPostgres.findOne({ where: { username: 'testUser' } });
    expect(deletedUser).toBeNull();
  });

});
