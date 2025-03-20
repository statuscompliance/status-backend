import mongoose from 'mongoose';

let mongoServer;
export const connect = async () => {
};

export const closeDatabase = async () => {
  // Close MongoDB
  if (mongoose.connection.readyState) {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
    await mongoServer?.stop();
    console.log('[database] In-memory MongoDB closed');
  }
};

export const clearDatabase = async () => {
  // Clear MongoDB collections
  const collections = mongoose.connection.collections;
  await Promise.all(
    Object.values(collections).map(async (collection) => {
      await collection.deleteMany();
    })
  );
  console.log('[database] In-memory MongoDB cleared');
};
