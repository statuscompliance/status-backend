import { it, expect, beforeAll, afterAll, describe } from 'vitest';
import { connectPostgreSQL, disconnectPostgreSQL} from '../../setup/postgreConnection.js';

describe("PostgreSQL Connection", () => {
  
    beforeAll(() => {
      // Establish connection to PostgreSQL before running tests
      connectPostgreSQL();
    });
  
    afterAll(async () => {
      // Close the PostgreSQL connection after all tests have finished
      await disconnectPostgreSQL();
    });

    describe('Database Connections', () => {
  
      // Test to check PostgreSQL connection without try-catch
      it('should connect to PostgreSQL successfully', async () => {
        await connectPostgreSQL();
        expect(true).toBe(true); // If no error is thrown, the connection is successful
      });
    });    

});
  

  
