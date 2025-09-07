import express from 'express';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import { auth, admin } from '../utils/auth.js';
import nodemailer from 'nodemailer';
const router = express.Router();

// Get admin dashboard stats
router.get('/stats', auth, admin, async (req, res) => {
  try {
    const productCount = await Product.countDocuments();
    const orderCount = await Order.countDocuments();
    const userCount = await User.countDocuments();
    const totalRevenue = await Order.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$totalPrice' } } }
    ]);

    res.json({
      productCount,
      orderCount,
      userCount,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ msg: 'Error fetching stats' });
  }
});

// Add product
router.post('/products', auth, admin, async (req, res) => {
  try {
    const { name, description, price, image, category, inStock } = req.body;
    
    // Validation
    if (!name || !description || !price) {
      return res.status(400).json({ msg: 'Name, description, and price are required' });
    }
    
    if (price < 0) {
      return res.status(400).json({ msg: 'Price must be non-negative' });
    }
    
    const product = new Product({
      name: name.trim(),
      description: description.trim(),
      price: parseFloat(price),
      image: image || '',
      category: category || 'Lighting',
      inStock: inStock !== undefined ? inStock : true
    });
    
    await product.save();
    res.status(201).json(product);
  } catch (error) {
    console.error('Add product error:', error);
    res.status(500).json({ msg: 'Error adding product' });
  }
});

// Edit product
router.put('/products/:id', auth, admin, async (req, res) => {
  try {
    const { name, description, price, image, category, inStock } = req.body;
    
    // Validation
    if (price !== undefined && price < 0) {
      return res.status(400).json({ msg: 'Price must be non-negative' });
    }
    
    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = parseFloat(price);
    if (image !== undefined) updateData.image = image;
    if (category !== undefined) updateData.category = category;
    if (inStock !== undefined) updateData.inStock = inStock;
    updateData.updatedAt = new Date();
    
    const product = await Product.findByIdAndUpdate(
      req.params.id, 
      updateData, 
      { new: true, runValidators: true }
    );
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Edit product error:', error);
    res.status(500).json({ msg: 'Error updating product' });
  }
});

// Delete product
router.delete('/products/:id', auth, admin, async (req, res) => {
  try {
    const product = await Product.findByIdAndDelete(req.params.id);
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    res.json({ msg: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ msg: 'Error deleting product' });
  }
});

// Get all orders with pagination
router.get('/orders', auth, admin, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const orders = await Order.find()
      .populate('items.product', 'name price image')
      .populate('user', 'email firstName lastName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
    
    const totalOrders = await Order.countDocuments();
    
    res.json({
      orders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasNext: page * limit < totalOrders,
        hasPrev: page > 1
      }
    });
  } catch (error) {
    console.error('Orders error:', error);
    res.status(500).json({ msg: 'Error fetching orders' });
  }
});

// Update order status
router.put('/orders/:id/status', auth, admin, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ msg: 'Invalid status' });
    }
    
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status, updatedAt: new Date() },
      { new: true }
    ).populate('items.product user');
    
    if (!order) {
      return res.status(404).json({ msg: 'Order not found' });
    }
    
    res.json(order);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ msg: 'Error updating order status' });
  }
});

// Email notification (on demand, or after new order)
router.post('/notify', auth, admin, async (req, res) => {
  try {
    // Only proceed if SMTP is configured
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) {
      return res.status(501).json({ msg: 'Email service not configured' });
    }
    
    let transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
    
    const { to, subject, text, html } = req.body;
    
    if (!to || !subject || (!text && !html)) {
      return res.status(400).json({ msg: 'Missing required email fields' });
    }
    
    await transporter.sendMail({
      from: process.env.SMTP_USER,
      to,
      subject,
      text,
      html
    });
    
    res.json({ msg: 'Email sent successfully' });
  } catch (error) {
    console.error('Email error:', error);
    res.status(500).json({ msg: 'Error sending email' });
  }
});

export default router;
