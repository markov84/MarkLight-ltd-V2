import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { id: user._id.toString(), email: user.email, username: user.username, isAdmin: !!user.isAdmin },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

const cookieOpts = {
  httpOnly: true,
  sameSite: process.env.COOKIE_SAMESITE || 'None',
  secure: String(process.env.COOKIE_SECURE || 'true') === 'true',
  path: '/',
  maxAge: 7 * 24 * 3600 * 1000
};

router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user.id).select('-password');
  if (!user) return res.status(404).json({ msg: 'User not found' });
  res.json({ user });
});

router.post('/login', async (req, res) => {
  const { username, email, password } = req.body || {};
  const query = email ? { email } : { username };
  const user = await User.findOne(query);
  if (!user) return res.status(401).json({ msg: 'Invalid credentials' });
  const ok = await bcrypt.compare(password || '', user.password || '');
  if (!ok) return res.status(401).json({ msg: 'Invalid credentials' });
  if (user.isActive === false) return res.status(403).json({ msg: 'Account disabled' });
  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.json({ msg: 'ok', user: { id: user._id, username: user.username, email: user.email, isAdmin: user.isAdmin } });
});

router.post('/logout', (req, res) => {
  res.clearCookie('token', { ...cookieOpts, maxAge: 0 });
  res.json({ msg: 'ok' });
});

router.post('/register', async (req, res) => {
  const { email, username, password } = req.body || {};
  if (!email || !username || !password) return res.status(400).json({ msg: 'Missing fields' });
  const exists = await User.findOne({ $or: [{ email }, { username }] });
  if (exists) return res.status(409).json({ msg: 'Email or username in use' });
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, username, password: hash, isAdmin: false });
  const token = signToken(user);
  res.cookie('token', token, cookieOpts);
  res.status(201).json({ msg: 'ok', user: { id: user._id, username, email, isAdmin: false } });
});

export default router;
