import { it, expect } from "vitest";
import { describe, it, expect, beforeAll, afterAll } from 'vitest';

// Import the MongoDB user model
import { UserMongo } from '../utils/userMongo';

// Import functions to handle database connections
import { 
  connectMongoDB, 
  disconnectMongoDB 
} from '../../setup/mongoConnection.js';

// Test suite for database connections
describe("Database Connections", () => {

  // Setup: Runs before all tests
  beforeAll(async () => {
    // Connect to MongoDB before running the tests
    await connectMongoDB();

  });

  // Cleanup: Runs after all tests
  afterAll(async () => {
    // Disconnect from MongoDB
    await disconnectMongoDB();
  });

  // Test suite for MongoDB connection and operations
  describe('MongoDB Connection and Operations', () => {
    it('inserts, updates, and deletes a document', async () => {
      // Create a new user in MongoDB
      const createdUser = await UserMongo.create({ username: 'testuser', password: 'test123' });
      
      // Verify that the user was created correctly
      expect(createdUser.username).toBe('testuser');
      expect(createdUser.password).toBe('test123');

      // Find the created user in the database
      const foundUser = await UserMongo.findOne({ username: 'testuser' });
      expect(foundUser).not.toBeNull();
      expect(foundUser.username).toBe('testuser');
      expect(foundUser.password).toBe('test123');

      // Update the user's password
      await UserMongo.updateOne({ username: 'testuser' }, { $set: { password: 'newpassword' } });

      // Verify that the password has been updated
      const updatedUser = await UserMongo.findOne({ username: 'testuser' });
      expect(updatedUser.password).toBe('newpassword');

      // Delete the user from the database
      await UserMongo.deleteMany({ username: 'testuser' });

      // Verify that the user has been deleted
      const deletedUser = await UserMongo.findOne({ username: 'testuser' });
      console.log('deletedUser:', deletedUser);
      expect(deletedUser).toBeNull();
    });

  });

});