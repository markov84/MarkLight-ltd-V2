import express from 'express';
import ChatMessage from '../models/ChatMessage.js';
import { auth, admin } from '../utils/auth.js';

const router = express.Router();

// Вземи всички съобщения за поръчка
router.get('/:orderId', auth, async (req, res) => {
  const messages = await ChatMessage.find({ order: req.params.orderId }).sort({ createdAt: 1 });
  res.json(messages);
});

// Клиент: изпрати съобщение
router.post('/send/:orderId', auth, async (req, res) => {
  const msg = new ChatMessage({
    order: req.params.orderId,
    from: 'client',
    user: req.user.id,
    message: req.body.message
  });
  await msg.save();
  res.status(201).json(msg);
});

// Админ: изпрати съобщение
router.post('/admin/send/:orderId', auth, admin, async (req, res) => {
  const msg = new ChatMessage({
    order: req.params.orderId,
    from: 'admin',
    user: req.user.id,
    message: req.body.message
  });
  await msg.save();
  res.status(201).json(msg);
});

export default router;
