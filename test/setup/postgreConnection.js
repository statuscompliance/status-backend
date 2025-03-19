import { Sequelize } from 'sequelize';
import {userPostgres} from '../unit/utils/userPostgres'

// Create a new Sequelize instance for PostgreSQL
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

export const UserPostgres = sequelize.define("User", userPostgres, {
  tableName: 'users', // Name of the table in the DB
  timestamps: true // Enable createdAt and 
});

// Function to connect to PostgreSQL
export const connectPostgreSQL = async () => {
  // Authenticate the connection to the PostgreSQL database
  await sequelize.authenticate();
}

// Function to disconnect from PostgreSQL
export const disconnectPostgreSQL = async () => {
  // Close the connection to the PostgreSQL server
  await sequelize.close();
};