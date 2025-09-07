import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { admin, auth } from '../utils/auth.js';

const router = express.Router();

// Общи статистики за поръчки
router.get('/orders', auth, admin, async (req, res) => {
  const totalOrders = await Order.countDocuments();
  const totalRevenue = await Order.aggregate([
    { $group: { _id: null, sum: { $sum: '$grandTotal' } } }
  ]);
  const byStatus = await Order.aggregate([
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);
  res.json({
    totalOrders,
    totalRevenue: totalRevenue[0]?.sum || 0,
    byStatus
  });
});

// Топ продукти по продажби
router.get('/top-products', auth, admin, async (req, res) => {
  const top = await Order.aggregate([
    { $unwind: '$items' },
    { $group: { _id: '$items.product', sold: { $sum: '$items.quantity' } } },
    { $sort: { sold: -1 } },
    { $limit: 10 }
  ]);
  const products = await Product.find({ _id: { $in: top.map(t => t._id) } });
  res.json(products);
});

export default router;
