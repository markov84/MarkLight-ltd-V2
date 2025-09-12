import express from 'express';

import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { auth, admin } from '../utils/auth.js';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import Wishlist from '../models/Wishlist.js';
import Message from '../models/Message.js';
import Suggestion from '../models/Suggestion.js';

const router = express.Router();

// GET /api/messages - всички съобщения от админ към логнатия потребител
router.get('/messages', auth, async (req, res) => {
  try {
    const messages = await Message.find({ to: req.user._id }).sort({ sentAt: -1 });
    res.json(messages);
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при зареждане на съобщения', error: e.message });
  }
});

// POST /api/admin/message - админ изпраща чат съобщение на потребител
router.post('/message', auth, admin, async (req, res) => {
  try {
    const { toUserId, text } = req.body;
    if (!toUserId || !text || text.length < 1) return res.status(400).json({ msg: 'Липсва получател или текст.' });
    const user = await User.findById(toUserId);
    if (!user) return res.status(404).json({ msg: 'Потребителят не е намерен.' });
    // Запис в базата
    const msg = new Message({ to: user._id, from: null, text });
    await msg.save();
    // Email (ако има)
    if (user.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: String(process.env.SMTP_PORT) === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: user.email,
          subject: 'Съобщение от админ',
          text,
          html: `<p>Администраторът ви изпрати съобщение:</p><blockquote>${text}</blockquote>`
        });
      } catch (err) {}
    }
    // Socket.io emit
    if (req.app.get('io')) {
      req.app.get('io').to(String(user._id)).emit('adminMessage', {
        messageId: msg._id,
        text,
        sentAt: msg.sentAt
      });
    }
    res.json({ msg: 'Съобщението е изпратено!', message: msg });
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при изпращане на съобщение', error: e.message });
  }
});

// DELETE /api/admin/reviews/all - масово изтриване на всички ревюта

/* ================= WISHLISTS (ADMIN) ================= */
// GET /api/admin/wishlists - списък с всички wishlist-и
router.get('/wishlists', auth, admin, async (req, res) => {
  try {
    const wishlists = await Wishlist.find()
      .populate('user', 'email firstName lastName')
      .populate('products', 'name price image');
    res.json(wishlists);
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching wishlists', error: e.message });
  }
});
import { multiUpload, watermarkUploadedImages } from '../middleware/upload.js';
import { addWatermark } from '../utils/watermark.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.resolve(__dirname, '../../uploads');

// Ensure uploads dir exists
import fsSync from 'fs';
if (!fsSync.existsSync(uploadsDir)) fsSync.mkdirSync(uploadsDir, { recursive: true });

/* ================= WATERMARK PREVIEW ================= */
import multer from 'multer';
import sharp from 'sharp';
const previewUpload = multer({ storage: multer.memoryStorage() });
router.post('/watermark-preview', previewUpload.single('image'), async (req, res) => {
  try {
    // TODO: Implement watermark preview logic here
    res.status(501).json({ msg: 'Not implemented' });
  } catch (error) {
    console.log('Error in /watermark-preview:', error);
    return res.status(500).json({ msg: 'Грешка при watermark preview' });
  }
});

function parseImagesField(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val.map(normalize);
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr)) return arr.map(normalize);
    } catch { }
    return [normalize(val)];
  }
  return [];
}

// GET /api/admin/reviews - списък с всички ревюта
router.get('/reviews', async (req, res) => {
  try {
    let query = {};
    if (Review.schema.paths.isDeleted) {
      query.isDeleted = { $ne: true };
    }
    const reviews = await Review.find(query); // само сурови ревюта, без populate
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching reviews', error: e.message });
  }
});

// DELETE /api/admin/reviews/:id - изтриване на ревю
router.delete('/reviews/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    console.log('DELETE /reviews/:id', id);
    if (!id || typeof id !== 'string') {
      console.log('Invalid id param:', id);
      return res.status(400).json({ message: 'Invalid id' });
    }
    if (!id.match(/^[a-fA-F0-9]{24}$/)) {
      console.log('Invalid ObjectId format:', id);
      return res.status(400).json({ message: 'Invalid ObjectId format' });
    }
    const review = await Review.findById(id);
    console.log('Review found:', review);
    if (!review) {
      console.log('Review not found for id:', id);
      return res.status(404).json({ message: 'Review not found' });
    }
    const deleted = await Review.findByIdAndDelete(id);
    console.log('Deleted review:', deleted);
    res.json({ message: 'Review deleted', deleted });
  } catch (error) {
    console.log('Error in DELETE /api/admin/reviews/:id:', error);
    return res.status(500).json({ msg: 'Грешка при изтриване на ревю' });
  }
});

/* ================= PRODUCT ROUTES ================= */
// GET /api/admin/products - списък с продукти (с филтри и пагинация)
router.get('/products', auth, admin, async (req, res) => {
  try {
    const { page = 1, limit = 20, search, category, subcategory, sort = 'createdAt' } = req.query;
    let query = {};
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    if (category) query.category = category;
    if (subcategory) query.subcategory = subcategory;
    let sortOptions = {};
    switch (sort) {
      case 'price_asc': sortOptions = { price: 1 }; break;
      default: sortOptions = { [sort]: -1 };
    }
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort(sortOptions)
      .skip(Number(skip))
      .limit(Number(limit));
    const total = await Product.countDocuments(query);
    res.json({
      products: Array.isArray(products) ? products : [],
      totalPages: Math.ceil(total / limit),
      currentPage: Number(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching products', error: e.message });
  }
});

// Create product
router.post('/products', auth, admin, multiUpload, watermarkUploadedImages, async (req, res) => {
  try {
    const body = req.body || {};
    if (body.category === '') body.category = null;
    if (body.subcategory === '') body.subcategory = null;

    let imagesArr = parseImagesField(body.images);
    let imagePath = body.image || '';

    // from uploaded files
    if (req.files?.image?.[0]) {
      const p = `/uploads/${req.files.image[0].filename}`;
      imagePath = p;
      imagesArr.push(p);
    }
    if (req.files?.localImage?.length) {
      for (const f of req.files.localImage) imagesArr.push(`/uploads/${f.filename}`);
    }
    if (req.files?.images?.length) {
      for (const f of req.files.images) imagesArr.push(`/uploads/${f.filename}`);
    }

    // from URL
    if (imagePath && imagePath.startsWith('http')) {
      imagePath = await saveUrlImage(imagePath);
      imagesArr.push(imagePath);
    }
    // Add any imagesUrls[] sent as URLs
    if (Array.isArray(body.imagesUrls)) {
      for (const url of body.imagesUrls) {
        if (url && url.startsWith('http')) imagesArr.push(await saveUrlImage(url));
      }
    }

    imagesArr = [...new Set(imagesArr.map(normalize))];

    const allowedFields = ['name', 'description', 'price', 'category', 'subcategory', 'featured', 'brand', 'model', 'specifications', 'tags', 'inStock', 'supplier', 'productCode'];
    const data = { image: imagePath, images: imagesArr };
    for (const k of allowedFields) if (body[k] !== undefined) data[k] = body[k];

    if (data.price !== undefined) {
      const price = Number(data.price);
      if (Number.isNaN(price) || price < 0) return res.status(400).json({ msg: 'Цената трябва да е положително число.' });
      data.price = price;
    }

    const product = new Product(data);
    await product.save();
    await product.populate([
      { path: 'category', select: 'name' },
      { path: 'subcategory', select: 'name' }
    ]);
    res.status(201).json(product);
  } catch (e) {
    console.error('Create product error:', e);
    res.status(500).json({ msg: 'Error creating product', error: e.message });
  }
});

// Update product
router.put('/products/:id', auth, admin, multiUpload, watermarkUploadedImages, async (req, res) => {
  try {
    const body = req.body || {};
    if (body.category === '') body.category = null;
    if (body.subcategory === '') body.subcategory = null;

    let imagesArr = parseImagesField(body.images);
    let imagePath = body.image || '';

    if (req.files?.image?.[0]) {
      const p = `/uploads/${req.files.image[0].filename}`;
      imagePath = p;
      if (!imagesArr.includes(p)) imagesArr.push(p);
    }
    for (const g of ['localImage', 'images']) {
      if (req.files?.[g]?.length) {
        for (const f of req.files[g]) {
          const p = `/uploads/${f.filename}`;
          if (!imagesArr.includes(p)) imagesArr.push(p);
        }
      }
    }

    if (imagePath && imagePath.startsWith('http')) {
      imagePath = await saveUrlImage(imagePath);
      if (!imagesArr.includes(imagePath)) imagesArr.push(imagePath);
    }
    if (Array.isArray(body.imagesUrls)) {
      for (const url of body.imagesUrls) {
        if (url && url.startsWith('http')) {
          const p = await saveUrlImage(url);
          if (!imagesArr.includes(p)) imagesArr.push(p);
        }
      }
    }

    const allowedFields = ['name', 'description', 'price', 'category', 'subcategory', 'featured', 'brand', 'model', 'specifications', 'tags', 'inStock', 'supplier', 'productCode'];
    const updateData = { image: imagePath, images: [...new Set(imagesArr.map(normalize))] };
    for (const k of allowedFields) if (body[k] !== undefined) updateData[k] = body[k];

    if (updateData.price !== undefined) {
      const price = Number(updateData.price);
      if (Number.isNaN(price) || price < 0) return res.status(400).json({ msg: 'Цената трябва да е положително число.' });
      updateData.price = price;
    }

    let inc = 0;
    if (body.addStockQuantity !== undefined && body.addStockQuantity !== '') {
      const addValue = Number.parseInt(body.addStockQuantity, 10);
      if (!Number.isInteger(addValue) || addValue <= 0) {
        return res.status(400).json({ msg: 'addStockQuantity трябва да е цяло положително число.' });
      }
      inc = addValue;
    }

    const current = await Product.findById(req.params.id);
    if (!current) return res.status(404).json({ msg: 'Product not found' });

    // --- Добави воден знак към всички съществуващи снимки, ако не са маркирани като watermarked ---
    const { addWatermark } = await import('../utils/watermark.js');
    const fs = await import('fs/promises');
    const path = await import('path');
    let updatedImages = [];
    for (let imgPath of current.images || []) {
      if (typeof imgPath === 'string' && imgPath.startsWith('/uploads/') && !imgPath.includes('-wm_')) {
        const absPath = path.resolve('uploads', path.basename(imgPath));
        try {
          // Проверка дали файлът съществува
          await fs.access(absPath);
          const wmFile = await addWatermark(absPath);
          // Добави новия файл към images
          updatedImages.push('/uploads/' + path.basename(wmFile));
        } catch (e) {
          // Ако не може да се водомаркира, запази оригиналния път
          updatedImages.push(imgPath);
        }
      } else {
        updatedImages.push(imgPath);
      }
    }
    // Ако има нови снимки от редакцията, добави и тях
    for (let imgPath of updateData.images) {
      if (!updatedImages.includes(imgPath)) updatedImages.push(imgPath);
    }
    updateData.images = updatedImages;
    // Ако главната снимка е от uploads и не е водомаркирана, водомаркирай я
    if (current.image && typeof current.image === 'string' && current.image.startsWith('/uploads/') && !current.image.includes('-wm_')) {
      const absPath = path.resolve('uploads', path.basename(current.image));
      try {
        await fs.access(absPath);
        const wmFile = await addWatermark(absPath);
        updateData.image = '/uploads/' + path.basename(wmFile);
      } catch { }
    }

    const update = inc > 0 ? { $set: updateData, $inc: { stockQuantity: inc } } : { $set: updateData };
    const product = await Product.findOneAndUpdate({ _id: req.params.id }, update, { new: true })
      .populate('category', 'name')
      .populate('subcategory', 'name');

    res.json(product);
  } catch (e) {
    console.error('Edit product error:', e);
    res.status(500).json({ msg: 'Error updating product', error: e.message });
  }
});

// Delete product
router.delete('/products/:id', auth, admin, async (req, res) => {
  try {
    const del = await Product.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ msg: 'Product not found' });
    res.json({ msg: 'Product deleted successfully' });
  } catch (e) {
    console.error('Delete product error:', e);
    res.status(500).json({ msg: 'Error deleting product' });
  }
});

/* ================= CATEGORY & SUBCATEGORY (unchanged basic) ================= */
// GET /api/admin/categories - списък с категории
router.get('/categories', auth, admin, async (req, res) => {
  try {
    const categories = await Category.find().sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching categories', error: e.message });
  }
});

router.post('/categories', auth, admin, async (req, res) => {
  try {
    const existing = await Category.findOne({ $or: [{ name: req.body.name }, { slug: req.body.slug }] });
    if (existing) return res.status(400).json({ msg: 'Category with this name or slug already exists.' });
    const cat = new Category(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (e) {
    res.status(500).json({ msg: 'Error adding category', error: e.message });
  }
});

router.put('/categories/:id', auth, admin, async (req, res) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ msg: 'Category not found' });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ msg: 'Error updating category', error: e.message });
  }
});

router.delete('/categories/:id', auth, admin, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) return res.status(400).json({ msg: `Cannot delete category. It has ${productCount} products assigned to it.` });
    await Subcategory.deleteMany({ category: req.params.id });
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ msg: 'Category not found' });
    res.json({ msg: 'Category and its subcategories deleted successfully' });
  } catch (e) {
    res.status(500).json({ msg: 'Error deleting category' });
  }
});

router.get('/subcategories/:categoryId', auth, admin, async (req, res) => {
  try { const list = await Subcategory.find({ category: req.params.categoryId }).sort({ sortOrder: 1, name: 1 }); res.json(list); }
  catch (e) { res.status(500).json({ msg: 'Error fetching subcategories' }); }
});

router.get('/subcategories', auth, admin, async (req, res) => {
  try { const list = await Subcategory.find().populate('category', 'name').sort({ 'category.name': 1, sortOrder: 1, name: 1 }); res.json(list); }
  catch (e) { res.status(500).json({ msg: 'Error fetching subcategories' }); }
});

router.post('/subcategories', auth, admin, async (req, res) => {
  try {
    const existing = await Subcategory.findOne({ name: req.body.name, category: req.body.category });
    if (existing) return res.status(400).json({ msg: 'Вече има подкатегория с това име в тази категория.' });
    const sub = new Subcategory(req.body);
    await sub.save(); await sub.populate('category', 'name');
    res.status(201).json(sub);
  } catch (e) { res.status(500).json({ msg: 'Error adding subcategory', error: e.message }); }
});

router.put('/subcategories/:id', auth, admin, async (req, res) => {
  try { const sub = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category', 'name'); if (!sub) return res.status(404).json({ msg: 'Subcategory not found' }); res.json(sub); }
  catch (e) { res.status(500).json({ msg: 'Error updating subcategory', error: e.message }); }
});

router.delete('/reviews/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ msg: 'Невалиден идентификатор на ревю.' });
    }
    if (!id.match(/^[a-fA-F0-9]{24}$/)) {
      return res.status(400).json({ msg: 'Невалиден формат на ObjectId.' });
    }
    // Find and delete in one step
    const deleted = await Review.findOneAndDelete({ _id: id });
    if (!deleted) {
      return res.status(404).json({ msg: 'Ревюто не е намерено или вече е изтрито.' });
    }
    // Update product rating if needed
    if (deleted.product) {
      const rest = await Review.find({ product: deleted.product }).select('rating');
      const avg = rest.length ? (rest.reduce((s, r) => s + r.rating, 0) / rest.length) : 0;
      const product = await Product.findById(deleted.product);
      if (product) {
        product.rating = avg;
        product.reviewCount = rest.length;
        await product.save();
      }
    }
    return res.json({ msg: 'Ревюто е изтрито успешно' });
  } catch (error) {
    return res.status(500).json({ msg: 'Грешка при изтриване на ревю', error: error.message });
  }
});
// Removed misplaced code after the delete route
// GET /api/admin/orders - списък с всички поръчки
router.get('/orders', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find().populate('user', 'email firstName lastName');
    res.json(orders);
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при зареждане на поръчките', error: e.message });
  }
});
// POST /api/wish-suggestion - записване на желание/препоръка
// ...existing code...
// GET /api/admin/suggestions - списък с всички желания/препоръки
router.get('/suggestions', auth, admin, async (req, res) => {
  try {
    const suggestions = await Suggestion.find().populate('user', 'email firstName lastName').sort({ createdAt: -1 });
    res.json(suggestions);
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при зареждане на желанията', error: e.message });
  }
});

// DELETE /api/admin/suggestions/:id - триене на желание/препоръка
router.delete('/suggestions/:id', auth, admin, async (req, res) => {
  try {
    const del = await Suggestion.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ msg: 'Желанието не е намерено' });
    res.json({ msg: 'Желанието е изтрито успешно' });
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при триене', error: e.message });
  }
});

// PATCH /api/admin/suggestions/:id - редакция на желание/препоръка
router.patch('/suggestions/:id', auth, admin, async (req, res) => {
  try {
    const { text } = req.body;
    const suggestion = await Suggestion.findById(req.params.id);
    if (!suggestion) return res.status(404).json({ msg: 'Желанието не е намерено' });
    if (text) suggestion.text = text;
    suggestion.updatedAt = new Date();
    await suggestion.save();
    res.json({ msg: 'Желанието е редактирано успешно', suggestion });
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при редакция', error: e.message });
  }
});

// POST /api/admin/suggestions/:id/respond - отговор на желание/препоръка
router.post('/suggestions/:id/respond', auth, admin, async (req, res) => {
  try {
    const { response } = req.body;
    const suggestion = await Suggestion.findById(req.params.id).populate('user', 'email username');
    if (!suggestion) return res.status(404).json({ msg: 'Желанието не е намерено' });
    suggestion.response = response;
    suggestion.updatedAt = new Date();
    await suggestion.save();

    // Изпращане на email до потребителя
    if (suggestion.user?.email && response) {
      try {
        const transporter = require('nodemailer').createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: String(process.env.SMTP_PORT) === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: suggestion.user.email,
          subject: 'Отговор на вашето мнение/препоръка',
          text: `Администраторът отговори на вашето мнение: ${response}`,
          html: `<p>Администраторът отговори на вашето мнение:</p><blockquote>${response}</blockquote>`
        });
        console.log('Email изпратен успешно до:', suggestion.user.email);
      } catch (err) {
        console.error('Грешка при изпращане на email:', err);
      }
    }

    // Изпращане на чат съобщение (примерен emit, ако имате socket.io)
    if (req.app.get('io') && suggestion.user?._id) {
      req.app.get('io').to(String(suggestion.user._id)).emit('adminReply', {
        suggestionId: suggestion._id,
        response,
        text: suggestion.text
      });
    }

    res.json({ msg: 'Отговорът е записан успешно и изпратен на потребителя', suggestion });
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при записване на отговор', error: e.message });
  }
});

/* ================= EMAIL ================= */
router.post('/notify', auth, admin, async (req, res) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return res.status(501).json({ msg: 'Email service not configured' });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
  secure: String(process.env.SMTP_PORT) === '465',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  tls: { rejectUnauthorized: false }
    });
    const { to, subject, text, html } = req.body;
    if (!to || !subject || (!text && !html)) return res.status(400).json({ msg: 'Липсват задължителни полета за email' });
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html }, (err, info) => {
      if (err) {
        console.error('Грешка при изпращане на email:', err);
        return res.status(500).json({ msg: 'Грешка при изпращане на email', error: err.message });
      }
      res.json({ msg: 'Email изпратен успешно!', info });
    });
  } catch (e) {
    console.error('Грешка при изпращане на email:', e);
    res.status(500).json({ msg: 'Грешка при изпращане на email', error: e.message });
  }
});

// Маршрут за ревюта - преместен най-отгоре
router.get('/reviews', async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name category brand model')
      .populate('user', 'firstName lastName email');
    const formatted = reviews.map(r => ({
      id: r._id,
      comment: r.comment,
      rating: r.rating,
      date: r.createdAt,
      user: r.user ? {
        id: r.user._id,
        name: `${r.user.firstName || ''} ${r.user.lastName || ''}`.trim(),
        email: r.user.email
      } : null,
      product: r.product ? {
        id: r.product._id,
        name: r.product.name,
        category: r.product.category,
        brand: r.product.brand,
        model: r.product.model
      } : null
    }));
  res.json(formatted);
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при зареждане на ревюта', error: e.message });
  }
});


// PATCH /api/admin/reviews/:id - редакция на ревю (админ)
router.patch('/reviews/:id', auth, admin, async (req, res) => {
  try {
    const { id } = req.params;
    const { comment, rating, reply } = req.body;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ msg: 'Невалиден идентификатор на ревю.' });
    }
    const review = await Review.findById(id).populate('user', 'email firstName lastName');
    if (!review) return res.status(404).json({ msg: 'Ревюто не е намерено' });
    if (comment !== undefined) review.comment = comment;
    if (rating !== undefined) {
      const r = Number(rating);
      if (isNaN(r) || r < 1 || r > 5) return res.status(400).json({ msg: 'Оценката трябва да е между 1 и 5' });
      review.rating = r;
    }
    if (reply !== undefined) review.reply = reply;
    await review.save();
    if (review.product) {
      const rest = await Review.find({ product: review.product }).select('rating');
      const avg = rest.length ? (rest.reduce((s, r) => s + r.rating, 0) / rest.length) : 0;
      await Product.findByIdAndUpdate(review.product, { $set: { rating: avg, reviewCount: rest.length } });
    }
    // Изпращане на email до потребителя, ако има отговор
    if (reply && review.user?.email) {
      try {
        const transporter = nodemailer.createTransport({
          host: process.env.SMTP_HOST,
          port: Number(process.env.SMTP_PORT) || 587,
          secure: String(process.env.SMTP_PORT) === '465',
          auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
          tls: { rejectUnauthorized: false }
        });
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: review.user.email,
          subject: 'Отговор на вашето ревю',
          text: `Администраторът отговори на вашето ревю: ${reply}`,
          html: `<p>Администраторът отговори на вашето ревю:</p><blockquote>${reply}</blockquote>`
        });
        console.log('Email изпратен успешно до:', review.user.email);
      } catch (err) {
        console.error('Грешка при изпращане на email:', err);
      }
    }
    res.json({ msg: 'Ревюто е редактирано успешно', review });
  } catch (e) {
    res.status(500).json({ msg: 'Грешка при редакция на ревю', error: e.message });
  }
});

// GET /api/admin/stats - примерна статистика за админ панела
router.get('/stats', async (req, res) => {
  try {
    const usersCount = await User.countDocuments();
    const productsCount = await Product.countDocuments();
    const reviewsCount = await Review.countDocuments();
    res.json({ usersCount, productsCount, reviewsCount });
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching stats', error: e.message });
  }
});

// Normalize image/file path helper
function normalize(val) {
  if (typeof val !== 'string') return val;
  return val.trim().replace(/\\/g, '/');
}

export default router;
