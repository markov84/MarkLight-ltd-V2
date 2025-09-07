import mongoose from 'mongoose';
import User from '../models/User.js';

async function cleanupUsers() {
  await mongoose.connect('mongodb://localhost:27017/yourdbname'); // смени yourdbname с името на твоята база
  const result = await User.deleteMany({ $or: [ { passwordHash: { $exists: false } }, { passwordHash: '' } ] });
  console.log('Изтрити потребители:', result.deletedCount);
  await mongoose.disconnect();
}

cleanupUsers();
