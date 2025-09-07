import mongoose from 'mongoose';
import User from '../models/User.js';

async function checkAdmin() {
  await mongoose.connect('mongodb+srv://marklaitood:markov84@mark-light.qnqwoib.mongodb.net/MARKLAIGHT-LTD?retryWrites=true&w=majority&appName=MARK-LIGHT');
  const user = await User.findOne({ username: 'admin' });
  if (!user) {
    console.log('Няма намерен потребител с username "admin".');
  } else {
    console.log('username:', user.username);
    console.log('email:', user.email);
    console.log('isAdmin:', user.isAdmin);
    console.log('passwordHash:', user.passwordHash ? '[OK]' : '[Празно]');
  }
  await mongoose.disconnect();
}

checkAdmin();
