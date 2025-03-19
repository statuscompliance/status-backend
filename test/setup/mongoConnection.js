import mongoose from 'mongoose';

// Function to connect to MongoDB
export const connectMongoDB = async () => {
  // Establish a connection to MongoDB using the URI from environment variables
  await mongoose.connect(process.env.MONGO_URI, {
    // Options can be added here if necessary (e.g., useNewUrlParser, useUnifiedTopology, etc.)
  });
};
// Function to check if MongoDB is connected
export const isConnectedMongo = () => {
  // Check the connection state of MongoDB (1 means connected)
  const connect = mongoose.connection.readyState;
  return connect;
}

// Function to disconnect from MongoDB
export const disconnectMongoDB = async () => {
  // Drop the database (clear all collections and documents)
  await mongoose.connection.dropDatabase();
  // Disconnect from the MongoDB server
  await mongoose.disconnect();
};
