import express from 'express';
import { auth } from '../utils/auth.js';
import Order from '../models/Order.js';

const router = express.Router();

// Вземи тракинг информация за поръчка
router.get('/track/:orderId', auth, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ msg: 'Поръчката не е намерена.' });
  // Симулирана интеграция с куриер
  res.json({
    carrier: order.shipping?.carrier || 'econt',
    tracking: order.shipping?.tracking || '',
    status: order.status || 'new',
    estimatedDelivery: '2-4 работни дни'
  });
});

// Админ: обнови тракинг номер
router.post('/update-tracking/:orderId', auth, async (req, res) => {
  const order = await Order.findById(req.params.orderId);
  if (!order) return res.status(404).json({ msg: 'Поръчката не е намерена.' });
  order.shipping.tracking = req.body.tracking || '';
  await order.save();
  res.json(order);
});

export default router;
