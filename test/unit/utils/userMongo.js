import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
  });
  
  const UserMongo = mongoose.model("User", userSchema);
  
  module.exports = {  UserMongo };