import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Sequelize } from 'sequelize';
import mongoose from 'mongoose';

describe("test", () => {
    it("should work", () => {
        expect(true).toBe(true);
    });
});

const sequelize = new Sequelize({
  dialect: 'postgres',
  port: process.env.DB_PORT || 5432,
  host: process.env.DB_HOST || 'localhost',
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  database: process.env.DB_NAME || 'statusdb',
  ssl: false,
  logging: false,
});

describe('Database Connections', () => {
  // Prueba conexión a PostgreSQL
  it('should connect to PostgreSQL successfully', async () => {
    try {
      await sequelize.authenticate();
      expect(true).toBe(true);
    } catch (error) {
      console.error('[Test] Error connecting to PostgreSQL:', error);
      expect(error).toBeNull();
    }
  });

  // Prueba conexión a MongoDB
  it('should connect to MongoDB successfully', async () => {
    try {
      await mongoose.connect(process.env.MONGO_URI);
      expect(mongoose.connection.readyState).toBe(1); // 1 = Conectado
    } catch (error) {
      console.error('[Test] Error connecting to MongoDB:', error);
      expect(error).toBeNull();
    }
  });

  // Cerrar conexiones después de las pruebas
  afterAll(async () => {
    await sequelize.close();
    await mongoose.connection.close();
  });
});

