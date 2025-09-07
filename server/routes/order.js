async function notifyCustomerNewOrder(order) {
  if (!order.email) return;
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  });
  const from = process.env.FROM_EMAIL || 'no-reply@marklight.example';
  const to = order.email;
  const subject = 'Потвърждение на поръчка в MarkLight';
  const text = `Здравейте, ${order.customerName || 'клиент'}!\n\nБлагодарим Ви за поръчката в MarkLight.\n\nСума: ${order.grandTotal} ${order.currency}\nТелефон: ${order.phone}\nИмейл: ${order.email}\nСтатус: ${order.status}\n\nЩе се свържем с Вас при обработка и изпращане.\n\nПоздрави,\nЕкипът на MarkLight`;
  await transporter.sendMail({ from, to, subject, text });
}
import express from 'express';
import Order from '../models/Order.js';
import Product from '../models/Product.js';

import { auth, admin } from '../utils/auth.js';
import { calculateQuote } from '../utils/shippingRates.js';
const router = express.Router();

import nodemailer from 'nodemailer';

async function notifyAdminNewOrder(order) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined,
    tls: { rejectUnauthorized: false }
  });
  const from = process.env.FROM_EMAIL || 'no-reply@marklight.example';
  const to = process.env.ADMIN_EMAIL || 'admin@marklight.com';
  const subject = 'Нова поръчка в MarkLight';
  const text = `Имате нова поръчка от ${order.customerName || order.email || 'клиент'}.
Сума: ${order.grandTotal} ${order.currency}
Телефон: ${order.phone}
Имейл: ${order.email}
Детайли: ${JSON.stringify(order.items)}
`;
  await transporter.sendMail({ from, to, subject, text });
}

// Admin: get all orders
router.get('/all', auth, admin, async (req, res) => {
  const orders = await Order.find({}).populate('items.product user');
  res.json(orders);
});

/**
 * Create order (auth required)
 * Body: { items: [{product, quantity}], shipping: { carrier, toOffice, toOfficeId, city, address1 }, payment: { method }, phone, customerName, email, notes }
 */
router.post('/', auth, async (req, res) => {
  const { items = [], shipping = {}, payment = {}, phone = '', customerName = '', email = '', notes = '' } = req.body || {};
  const session = await Product.startSession();
  try {
    let subtotal = 0;
    await session.withTransaction(async () => {
      for (const { product, quantity } of items) {
        const p = await Product.findById(product).session(session);
        if (!p || p.stockQuantity < quantity) throw new Error('Недостатъчна наличност за продукт.');
        subtotal += (p.discountedPrice || p.price || 0) * quantity;
        await Product.updateOne(
          { _id: product, stockQuantity: { $gte: quantity } },
          { $inc: { stockQuantity: -quantity }, $set: { inStock: p.stockQuantity - quantity > 0 } }
        ).session(session);
      }
    });

    const isCOD = (payment?.method || 'cod') === 'cod';
    const q = calculateQuote({
      carrier: shipping?.carrier || 'econt',
      toOffice: shipping?.toOffice !== false,
      subtotal,
      cod: isCOD
    });

    const order = await Order.create([{
      user: req.user.id,
      items,
      subtotal,
      shipping: {
        carrier: shipping?.carrier || 'econt',
        toOffice: shipping?.toOffice !== false,
        toOfficeId: shipping?.toOfficeId || '',
        city: shipping?.city || '',
        address1: shipping?.address1 || '',
        price: q.shipping,
        currency: 'BGN'
      },
      payment: {
        method: payment?.method || 'cod',
        status: payment?.method === 'card' ? 'pending' : 'pending',
        codFee: q.codFee,
        currency: 'BGN',
        provider: payment?.provider || ''
      },
      grandTotal: q.grandTotal,
      currency: 'BGN',
      phone,
      customerName,
      email,
      notes,
      status: 'new'
    }], { session });

    // Изпрати имейл до администратор
    try {
      await notifyAdminNewOrder(order[0]);
    } catch (e) {
      console.error('Admin email notification error:', e);
    }
    // Изпрати имейл потвърждение към клиента
    try {
      await notifyCustomerNewOrder(order[0]);
    } catch (e) {
      console.error('Customer email notification error:', e);
    }
    res.status(201).json(order[0]);
  } catch (err) {
    await session.abortTransaction();
    res.status(400).json({ msg: err.message || 'Грешка при създаване на поръчка.' });
  } finally {
    session.endSession();
  }
});

router.get('/my', auth, async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).populate('items.product');
  res.json(orders);
});

export default router;