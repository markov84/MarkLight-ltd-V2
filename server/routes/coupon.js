import express from 'express';
import Coupon from '../models/Coupon.js';
import { auth, admin } from '../utils/auth.js';

const router = express.Router();

// Вземи всички активни купони
router.get('/active', async (req, res) => {
  const coupons = await Coupon.find({ active: true, expiresAt: { $gte: new Date() } });
  res.json(coupons);
});

// Провери купон по код
router.post('/validate', async (req, res) => {
  const { code, orderValue = 0 } = req.body;
  const coupon = await Coupon.findOne({ code, active: true, expiresAt: { $gte: new Date() } });
  if (!coupon) return res.status(404).json({ msg: 'Купонът не е валиден или е изтекъл.' });
  if (coupon.minOrderValue && orderValue < coupon.minOrderValue) {
    return res.status(400).json({ msg: 'Минималната стойност на поръчката за този купон не е достигната.' });
  }
  if (coupon.usageLimit > 0 && coupon.usedCount >= coupon.usageLimit) {
    return res.status(400).json({ msg: 'Купонът е изчерпан.' });
  }
  res.json({ valid: true, coupon });
});

// Админ: създай нов купон
router.post('/create', auth, admin, async (req, res) => {
  try {
    const coupon = new Coupon(req.body);
    await coupon.save();
    res.status(201).json(coupon);
  } catch (e) {
    res.status(400).json({ msg: 'Грешка при създаване на купон.' });
  }
});

// Админ: деактивирай купон
router.post('/deactivate/:id', auth, admin, async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) return res.status(404).json({ msg: 'Купонът не е намерен.' });
  coupon.active = false;
  await coupon.save();
  res.json(coupon);
});

export default router;
