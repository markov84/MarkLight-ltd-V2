import dotenv from 'dotenv';
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

dotenv.config();

const uri = process.env.MONGO_URI;
if (!uri) {
  console.error('MONGO_URI not set');
  process.exit(1);
}

const email = process.env.ADMIN_EMAIL || 'admin@example.com';
const username = process.env.ADMIN_USERNAME || 'admin';
const password = process.env.ADMIN_PASSWORD || 'admin123';

async function run() {
  await mongoose.connect(uri);
  let user = await User.findOne({ email });
  if (!user) {
    const hash = await bcrypt.hash(password, 10);
    user = await User.create({ email, username, password: hash, isAdmin: true, isActive: true });
    console.log('Created admin:', email);
  } else {
    if (!user.isAdmin) user.isAdmin = true;
    if (password) user.password = await bcrypt.hash(password, 10);
    await user.save();
    console.log('Updated admin:', email);
  }
  await mongoose.disconnect();
}
run().catch(e => { console.error(e); process.exit(1); });
