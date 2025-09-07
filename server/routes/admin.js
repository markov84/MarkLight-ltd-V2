import express from 'express';
const router = express.Router();
import axios from 'axios';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';
import { auth, admin } from '../utils/auth.js';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';
import Order from '../models/Order.js';
import User from '../models/User.js';
import nodemailer from 'nodemailer';
import Wishlist from '../models/Wishlist.js';
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
    if (!req.file) return res.status(400).json({ msg: 'No file uploaded' });
    const tmp = path.join(uploadsDir, `preview-${Date.now()}.jpg`);
    await sharp(req.file.buffer).toFile(tmp);
    await addWatermark(tmp);
    res.type('image/jpeg').sendFile(tmp, {}, async () => { try { await fs.unlink(tmp); } catch {} });
  } catch (e) {
    res.status(500).json({ msg: 'Error generating preview', error: e.message });
  }
});

/* ================= HELPERS ================= */
const normalize = (p) => (p?.startsWith('/uploads/') ? p : (p?.startsWith('http') ? p : (p ? '/uploads/' + p : '')));

async function saveUrlImage(url) {
  const ext = (path.extname(url).split('?')[0] || '.jpg').toLowerCase();
  const fileName = `${Date.now()}-urlimg${ext}`;
  const filePath = path.join(uploadsDir, fileName);
  const resp = await axios.get(url, { responseType: 'arraybuffer' });
  await fs.writeFile(filePath, Buffer.from(resp.data));
  const wmFile = await addWatermark(filePath);
  // Optionally, you can delete the original file if you want only the watermarked one
  try { await fs.unlink(filePath); } catch {}
  return `/uploads/${path.basename(wmFile)}`;
}

function parseImagesField(val) {
  if (!val) return [];
/* ================= REVIEWS (ADMIN) ================= */
// GET /api/admin/reviews - списък с всички ревюта
router.get('/reviews', auth, admin, async (req, res) => {
  try {
    const reviews = await Review.find()
      .populate('product', 'name')
      .populate('user', 'email firstName lastName');
    res.json(reviews);
  } catch (e) {
    res.status(500).json({ msg: 'Error fetching reviews', error: e.message });
  }
});

// DELETE /api/admin/reviews/:id - изтриване на ревю
router.delete('/reviews/:id', auth, admin, async (req, res) => {
  try {
    const del = await Review.findByIdAndDelete(req.params.id);
    if (!del) return res.status(404).json({ msg:'Review not found' });
    res.json({ msg:'Review deleted successfully' });
  } catch (e) {
    res.status(500).json({ msg:'Error deleting review' });
  }
});
  if (Array.isArray(val)) return val.map(normalize);
  if (typeof val === 'string') {
    try {
      const arr = JSON.parse(val);
      if (Array.isArray(arr)) return arr.map(normalize);
    } catch {}
    return [normalize(val)];
  }
  return [];
}

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
      case 'price_desc': sortOptions = { price: -1 }; break;
      case 'name_asc': sortOptions = { name: 1 }; break;
      case 'name_desc': sortOptions = { name: -1 }; break;
      case 'newest': sortOptions = { createdAt: -1 }; break;
      default: sortOptions = { createdAt: -1 };
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
      products,
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

    const allowedFields = ['name','description','price','category','subcategory','featured','brand','model','specifications','tags','inStock','supplier','productCode'];
    const data = { image: imagePath, images: imagesArr };
    for (const k of allowedFields) if (body[k] !== undefined) data[k] = body[k];

    if (data.price !== undefined) {
      const price = Number(data.price);
      if (Number.isNaN(price) || price < 0) return res.status(400).json({ msg:'Цената трябва да е положително число.' });
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
    for (const g of ['localImage','images']) {
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

    const allowedFields = ['name','description','price','category','subcategory','featured','brand','model','specifications','tags','inStock','supplier','productCode'];
    const updateData = { image: imagePath, images: [...new Set(imagesArr.map(normalize))] };
    for (const k of allowedFields) if (body[k] !== undefined) updateData[k] = body[k];

    if (updateData.price !== undefined) {
      const price = Number(updateData.price);
      if (Number.isNaN(price) || price < 0) return res.status(400).json({ msg:'Цената трябва да е положително число.' });
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
    if (!current) return res.status(404).json({ msg:'Product not found' });

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
      } catch {}
    }

    const update = inc > 0 ? { $set: updateData, $inc: { stockQuantity: inc } } : { $set: updateData };
    const product = await Product.findOneAndUpdate({ _id: req.params.id }, update, { new: true })
      .populate('category','name')
      .populate('subcategory','name');

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
    if (!del) return res.status(404).json({ msg:'Product not found' });
    res.json({ msg:'Product deleted successfully' });
  } catch (e) {
    console.error('Delete product error:', e);
    res.status(500).json({ msg:'Error deleting product' });
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
    const existing = await Category.findOne({ $or: [ { name: req.body.name }, { slug: req.body.slug } ] });
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
    if (!cat) return res.status(404).json({ msg:'Category not found' });
    res.json(cat);
  } catch (e) {
    res.status(500).json({ msg:'Error updating category', error: e.message });
  }
});

router.delete('/categories/:id', auth, admin, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ category: req.params.id });
    if (productCount > 0) return res.status(400).json({ msg:`Cannot delete category. It has ${productCount} products assigned to it.` });
    await Subcategory.deleteMany({ category: req.params.id });
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ msg:'Category not found' });
    res.json({ msg:'Category and its subcategories deleted successfully' });
  } catch (e) {
    res.status(500).json({ msg:'Error deleting category' });
  }
});

router.get('/subcategories/:categoryId', auth, admin, async (req, res) => {
  try { const list = await Subcategory.find({ category: req.params.categoryId }).sort({ sortOrder: 1, name: 1 }); res.json(list); }
  catch (e) { res.status(500).json({ msg:'Error fetching subcategories' }); }
});

router.get('/subcategories', auth, admin, async (req, res) => {
  try { const list = await Subcategory.find().populate('category','name').sort({ 'category.name': 1, sortOrder: 1, name: 1 }); res.json(list); }
  catch (e) { res.status(500).json({ msg:'Error fetching subcategories' }); }
});

router.post('/subcategories', auth, admin, async (req, res) => {
  try {
    const existing = await Subcategory.findOne({ name: req.body.name, category: req.body.category });
    if (existing) return res.status(400).json({ msg:'Вече има подкатегория с това име в тази категория.' });
    const sub = new Subcategory(req.body);
    await sub.save(); await sub.populate('category','name');
    res.status(201).json(sub);
  } catch (e) { res.status(500).json({ msg:'Error adding subcategory', error: e.message }); }
});

router.put('/subcategories/:id', auth, admin, async (req, res) => {
  try { const sub = await Subcategory.findByIdAndUpdate(req.params.id, req.body, { new: true }).populate('category','name'); if (!sub) return res.status(404).json({ msg:'Subcategory not found' }); res.json(sub); }
  catch (e) { res.status(500).json({ msg:'Error updating subcategory', error: e.message }); }
});

router.delete('/subcategories/:id', auth, admin, async (req, res) => {
  try {
    const productCount = await Product.countDocuments({ subcategory: req.params.id });
    if (productCount > 0) return res.status(400).json({ msg:`Cannot delete subcategory. It has ${productCount} products assigned to it.` });
    const sub = await Subcategory.findByIdAndDelete(req.params.id);
    if (!sub) return res.status(404).json({ msg:'Subcategory not found' });
    res.json({ msg:'Subcategory deleted successfully' });
  } catch (e) { res.status(500).json({ msg:'Error deleting subcategory' }); }
});

/* ================= ORDERS & STATS ================= */
router.get('/orders', auth, admin, async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('items.product', 'name price supplier productCode')
      .populate('user', 'email firstName lastName')
      .sort({ createdAt: -1 });
    res.json(orders);
  } catch (e) { res.status(500).json({ msg:'Error fetching orders' }); }
});

router.get('/stats', auth, admin, async (req, res) => {
  try {
    const [ totalProducts, totalCategories, totalSubcategories, totalUsers, totalOrders, recentOrders ] = await Promise.all([
      Product.countDocuments(),
      Category.countDocuments(),
      Subcategory.countDocuments(),
      User.countDocuments(),
      Order.countDocuments(),
      Order.find().populate('user','email firstName lastName').sort({ createdAt: -1 }).limit(5)
    ]);
    res.json({ totals: { products: totalProducts, categories: totalCategories, subcategories: totalSubcategories, users: totalUsers, orders: totalOrders }, recentOrders });
  } catch (e) { res.status(500).json({ msg:'Error fetching statistics' }); }
});

/* ================= EMAIL ================= */
router.post('/notify', auth, admin, async (req, res) => {
  try {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER) return res.status(501).json({ msg:'Email service not configured' });
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: String(process.env.SMTP_PORT) === '465',
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
    });
    const { to, subject, text, html } = req.body;
    if (!to || !subject || (!text && !html)) return res.status(400).json({ msg:'Missing required email fields' });
    await transporter.sendMail({ from: process.env.SMTP_FROM || process.env.SMTP_USER, to, subject, text, html });
    res.json({ msg:'Email sent successfully' });
  } catch (e) { res.status(500).json({ msg:'Error sending email' }); }
});

export default router;
