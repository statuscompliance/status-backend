import { it, expect, beforeAll, afterAll, describe } from 'vitest';
import { connectMongoDB, isConnectedMongo, disconnectMongoDB } from '../../setup/mongoConnection';

describe("MongoDB Connection", () => {
  
    beforeAll(async () => {
        // Establish connection to MongoDB before running tests
        await connectMongoDB();
    });

    describe('Database Connections', () => {
      
        it('should connect to MongoDB successfully', () => {
           // Check if MongoDB connection state is "1" (connected)
           const check = isConnectedMongo();            
           expect(check).toBe(1); // 1 = Connected
        });
    });

    afterAll(async () => {
      // Ensure MongoDB connection is closed after tests
      await disconnectMongoDB();
    });
});
