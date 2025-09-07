import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from '../models/User.js';

async function createAdmin() {
  await mongoose.connect('mongodb://localhost:27017/MARK-LIGHT-LTD');

  const username = 'admin';
  const email = 'admin@luxury.com';
  const password = 'asdasd';

  // Изтрий всички стари admin акаунти с този username или email
  const delResult = await User.deleteMany({ $or: [ { username }, { email } ] });
  console.log('Изтрити стари записи:', delResult.deletedCount);

  const passwordHash = await bcrypt.hash(password, 12);
  const user = new User({
    email,
    username,
    password: passwordHash,
    isAdmin: true,
    firstName: 'Admin',
    lastName: 'User'
  });
  await user.save();
  console.log('Създаден е админ акаунт: username=admin, password=asdasd');

  // Дебъг: покажи всички потребители в базата
  const allUsers = await User.find({});
  console.log('Всички потребители в базата:', allUsers.map(u => ({username: u.username, email: u.email, isAdmin: u.isAdmin})));

  // Проверка веднага след създаване
  const check = await User.findOne({ username });
  if (check) {
    console.log('Потвърдено: username:', check.username, 'email:', check.email, 'isAdmin:', check.isAdmin);
  } else {
    console.log('Грешка: не е намерен админ след създаване!');
  }

  await mongoose.disconnect();
}

createAdmin();
