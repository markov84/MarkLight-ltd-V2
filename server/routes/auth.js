import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import cookieParser from 'cookie-parser';
const router = express.Router();

// === Email verification helpers ===
function generateCode() {
  return Math.floor(10000 + Math.random() * 90000).toString(); // 5 digits
}

async function sendVerificationEmail(to, code) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  });
  const from = process.env.FROM_EMAIL || 'no-reply@marklight.example';
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Вашият код за потвърждение',
    text: `Вашият код за потвърждение е: ${code}`,
    html: `<p>Вашият код за потвърждение е: <b>${code}</b></p>`
  });
  console.log('Nodemailer info:', info);
  return info;
}

import nodemailer from 'nodemailer';


// Get user's favorites
router.get('/favorites', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.id).populate('favorites');
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
});

// Add product to favorites
router.post('/favorites/:productId', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const productId = req.params.productId;
    if (!user.favorites.includes(productId)) {
      user.favorites.push(productId);
      await user.save();
    }
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
});

// Remove product from favorites
router.delete('/favorites/:productId', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) return res.status(401).json({ msg: 'No token provided' });
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    const productId = req.params.productId;
    user.favorites = user.favorites.filter(fav => fav.toString() !== productId);
    await user.save();
    res.json({ favorites: user.favorites });
  } catch (error) {
    res.status(401).json({ msg: 'Invalid token' });
  }
});



// Forgot password route
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ msg: 'Email is required' });
  }
  const user = await User.findOne({ email: email.toLowerCase() });
  if (!user) {
    return res.status(404).json({ msg: 'User not found' });
  }
  // Генерирай secure reset token
  const crypto = await import('crypto');
  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 час
  await user.save();
  try {
    await sendResetEmail(email, resetToken);
    return res.json({ msg: 'Изпратихме инструкции за нова парола на вашия имейл.' });
  } catch (e) {
    return res.status(500).json({ msg: 'Грешка при изпращане на имейл.' });
  }
});

// Test GET route for /login
router.get('/login', (req, res) => {
  res.json({ msg: 'Login endpoint is working (GET)' });
});

// Logout route
router.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  res.json({ msg: 'Logged out' });
});

// Register route
router.post('/register', async (req, res) => {
  try {
    const { email, username, password, firstName, lastName } = req.body;

    if (!email || !username || !password) {
      return res.status(400).json({ msg: 'Email, username and password are required' });
    }
    if (password.length < 6) {
      return res.status(400).json({ msg: 'Password must be at least 6 characters' });
    }
    if (username.length < 3) {
      return res.status(400).json({ msg: 'Username must be at least 3 characters' });
    }
    // Check if user exists by email or username
    const existingUser = await User.findOne({
      $or: [
        { email: email.toLowerCase() },
        { username: username.toLowerCase() }
      ]
    });
    if (existingUser) {
      if (existingUser.email === email.toLowerCase()) {
        return res.status(409).json({ msg: 'User with this email already exists' });
      } else {
        return res.status(409).json({ msg: 'User with this username already exists' });
      }
    }
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    // Check if this should be an admin user (by email only)
    const isAdmin = email.toLowerCase() === (process.env.ADMIN_EMAIL || 'admin@luxury.com').toLowerCase();
    // Генерирай verification code и expiry
    const code = generateCode();
    // Съхрани username както е написан
    const user = new User({
      email: email.toLowerCase(),
      username: username, // оригинален casing
      password: hashedPassword,
      firstName: firstName || '',
      lastName: lastName || '',
      isAdmin: isAdmin,
      emailVerificationCode: code,
      emailVerificationExpires: new Date(Date.now() + 1 * 60 * 1000)
    });
    await user.save();
    try {
      await sendVerificationEmail(email, code);
    } catch (e) {
      console.error('Email send error:', e);
      // Може да върнеш съобщение, че имейлът не е изпратен, но регистрацията е успешна
    }
    res.status(201).json({
      msg: 'User registered successfully. Verification code sent to email.',
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ msg: 'Server error during registration' });
  }
});

// Login route
router.post('/login', async (req, res) => {
  try {
    const { username, email, password } = req.body;
    // Позволява логин с username ИЛИ email
    if ((!username && !email) || !password) {
      return res.status(400).json({ msg: 'Username/email and password are required' });
    }
    let user = null;
    if (username) {
      user = await User.findOne({ username: username.toLowerCase() });
    }
    if (!user && email) {
      user = await User.findOne({ email: email.toLowerCase() });
    }
    if (!user) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ msg: 'Invalid credentials' });
    }
    const token = jwt.sign(
      {
        id: user._id,
        email: user.email,
        username: user.username,
        isAdmin: user.isAdmin,
        firstName: user.firstName,
        lastName: user.lastName
      },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.CROSS_SITE_COOKIES === 'true' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });
    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ msg: 'Server error during login' });
  }
});

// Get user profile route
router.get('/profile', async (req, res) => {
  try {
    const token = req.cookies.token;
    if (!token) {
      return res.status(401).json({ msg: 'No token provided' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret_key');
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }
    res.json({
      user: {
        id: user._id,
        email: user.email,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        isAdmin: user.isAdmin,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(401).json({ msg: 'Invalid token' });
  }
});


// Временен тестов маршрут за проверка на админ акаунти
router.get('/testadmin', async (req, res) => {
  try {
    const admins = await User.find({ isAdmin: true }).select('-password');
    res.json({ admins });
  } catch (error) {
    res.status(500).json({ msg: 'DB error', error: error.message });
  }
});

export default router;


/**
 * Verify email with 5-digit code
 * Body: { email, code }
 */
router.post('/verify-email', async (req, res) => {
  try {
    const { email, code } = req.body;
    if (!email || !code) return res.status(400).json({ msg: 'Email и код са задължителни' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'Потребител не е намерен' });
    if (user.emailVerified) return res.json({ msg: 'Имейлът вече е потвърден' });

    if (!user.emailVerificationCode || !user.emailVerificationExpires) {
      return res.status(400).json({ msg: 'Няма активен код. Изпратете нов.' });
    }
    if (user.emailVerificationExpires < new Date()) {
      return res.status(400).json({ msg: 'Кодът е изтекъл. Изпратете нов.' });
    }
    if (user.emailVerificationCode !== code) {
      return res.status(400).json({ msg: 'Невалиден код' });
    }

    user.emailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    // Логване на успешна верификация
    console.log(`Email verified for user: ${user.email}, username: ${user.username}`);

    // Issue auth cookie after verification
    const jwt = (await import('jsonwebtoken')).default;
    const token = jwt.sign(
      { id: user._id, email: user.email, username: user.username, isAdmin: user.isAdmin, firstName: user.firstName, lastName: user.lastName },
      process.env.JWT_SECRET || 'fallback_secret_key',
      { expiresIn: '7d' }
    );
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.CROSS_SITE_COOKIES === 'true' ? 'none' : 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.json({ msg: 'Имейлът е потвърден', user: { id: user._id, email: user.email, username: user.username, isAdmin: user.isAdmin, firstName: user.firstName, lastName: user.lastName } });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ msg: 'Server error during verification' });
  }
});

/**
 * Resend code (rate limited globally by index.js)
 * Body: { email }
 */
router.post('/resend-code', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ msg: 'Email е задължителен' });
    const user = await User.findOne({ email });
    if (!user) return res.status(404).json({ msg: 'Потребител не е намерен' });
    if (user.emailVerified) return res.json({ msg: 'Имейлът вече е потвърден' });

    const code = generateCode();
    user.emailVerificationCode = code;
    user.emailVerificationExpires = new Date(Date.now() + 1 * 60 * 1000);
    await user.save();

    try {
      await sendVerificationEmail(email, code);
      return res.json({ msg: 'Нов код е изпратен' });
    } catch (smtpError) {
      console.error('SMTP error при resend-code:', smtpError);
      return res.status(500).json({ msg: 'SMTP error', error: smtpError.message });
    }
  } catch (error) {
    console.error('Resend code error:', error);
    return res.status(500).json({ msg: 'Server error during resend' });
  }
});

// Helper за изпращане на reset email
async function sendResetEmail(to, token) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  });
  const from = process.env.FROM_EMAIL || 'no-reply@marklight.example';
  const resetUrl = `${process.env.CLIENT_URL || 'http://localhost:5173'}/reset-password/${token}`;
  const info = await transporter.sendMail({
    from,
    to,
    subject: 'Възстановяване на парола',
    text: `За да смените паролата си, посетете: ${resetUrl}`,
    html: `<p>За да смените паролата си, <a href='${resetUrl}'>натиснете тук</a>.</p>`
  });
  console.log('Reset email info:', info);
  return info;
}

// Reset password route
router.post('/reset-password', async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password) {
    return res.status(400).json({ msg: 'Token и нова парола са задължителни.' });
  }
  // Password strength validation
  const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,30}$/;
  if (!strongPassword.test(password)) {

    return res.status(400).json({ msg: 'Паролата трябва да е между 8 и 30 символа и да съдържа малка, голяма буква, цифра и специален символ.' });
  }

  // Намери user по resetToken и expiry
  const user = await User.findOne({ resetPasswordToken: token, resetPasswordExpires: { $gt: new Date() } });
  if (!user) {
    return res.status(404).json({ msg: 'Невалиден или изтекъл токен.' });
  }
  user.password = await bcrypt.hash(password, 12);
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();
  return res.json({ msg: 'Паролата е сменена успешно.' });
});
