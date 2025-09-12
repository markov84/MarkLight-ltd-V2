
import express from 'express';
import { body, validationResult } from 'express-validator';
import logger from '../utils/logger.js';
import Product from '../models/Product.js';
import Review from '../models/Review.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';


const router = express.Router();



// ───────────────────────────────────────────────────────────────────────────────
// Редакция на ревю (admin)
// ───────────────────────────────────────────────────────────────────────────────
router.put('/:id/review', auth, async (req, res) => {
  try {
    const { reviewId, comment, rating } = req.body;
    if (!reviewId || !isValidObjectId(reviewId)) {
      return res.status(400).json({ msg: 'Невалиден reviewId' });
    }
    if (rating && (rating < 1 || rating > 5)) {
      return res.status(400).json({ msg: 'Оценката трябва да е между 1 и 5' });
    }
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ msg: 'Ревюто не е намерено' });
    if (comment !== undefined) review.comment = comment;
    if (rating !== undefined) review.rating = rating;
    await review.save();
    // Обнови агрегирания рейтинг и брой отзиви за продукта
    const reviews = await Review.find({ product: req.params.id }).select('rating');
    const avgRating = reviews.length === 0 ? 0 : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const product = await Product.findById(req.params.id);
    if (product) {
      product.rating = avgRating;
      product.reviewCount = reviews.length;
      await product.save();
    }
    res.json({ msg: 'Ревюто е редактирано успешно', review });
  } catch (error) {
    res.status(500).json({ msg: 'Грешка при редакция на ревю', error: error.message });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Helpers
// ───────────────────────────────────────────────────────────────────────────────
const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);

// ───────────────────────────────────────────────────────────────────────────────
// Добавяне на отзив (rating 1..5)
// ───────────────────────────────────────────────────────────────────────────────
import { auth } from '../utils/auth.js';

router.post(
  '/:id/review',
  auth,
  [
    body('rating')
      .isInt({ min: 1, max: 5 })
      .withMessage('Rating must be between 1 and 5'),
    body('comment').optional().isString().trim(),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = await Product.findById(req.params.id);
      if (!product) return res.status(404).json({ msg: 'Product not found' });

      const { rating, comment } = req.body;

      const review = new Review({
        product: product._id,
        user: req.user ? req.user.id : null, // ако има auth middleware
        rating,
        comment,
      });

      await review.save();

      // Обнови агрегирания рейтинг и брой отзиви
      const reviews = await Review.find({ product: product._id }).select('rating');
      const avgRating =
        reviews.length === 0
          ? 0
          : reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

      product.rating = avgRating;
      product.reviewCount = reviews.length;
      await product.save();

      res.status(201).json(review);
    } catch (error) {
      logger.error('Error adding review', { error });
      res.status(500).json({ msg: 'Error adding review' });
    }
  }
);

// ───────────────────────────────────────────────────────────────────────────────
// Създаване на нов продукт с валидация
// ───────────────────────────────────────────────────────────────────────────────
router.post(
  '/',
  [
    body('name').isString().trim().notEmpty().withMessage('Името е задължително'),
    body('description')
      .isString()
      .trim()
      .notEmpty()
      .withMessage('Описанието е задължително'),
    body('price').isFloat({ min: 0 }).withMessage('Цената трябва да е положително число'),
    body('category').isMongoId().withMessage('Категорията трябва да е валиден ID'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    logger.info('POST /api/products', { body: req.body });
    if (!errors.isEmpty()) {
      logger.warn('Validation error on product create', { errors: errors.array() });
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const product = new Product(req.body);
      await product.save();
      logger.info('Product created', { product });
      res.status(201).json(product);
    } catch (error) {
      logger.error('Create product error', { error });
      res.status(500).json({ msg: 'Error creating product' });
    }
  }
);

// ───────────────────────────────────────────────────────────────────────────────
// Featured продукти – сложи ПРЕДИ "/:id", за да не го засича като :id
// ───────────────────────────────────────────────────────────────────────────────
router.get('/featured/list', async (req, res) => {
  logger.info('GET /api/products/featured/list', { query: req.query });
  try {
    const limit = Number.parseInt(req.query.limit, 10) || 6;
    const products = await Product.find({ featured: true, inStock: true })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(products);
  } catch (error) {
    logger.error('Get featured products error', { error });
    res.status(500).json({ msg: 'Error fetching featured products' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Всички продукти с филтри/сортиране/пагинация
// ───────────────────────────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  logger.info('GET /api/products', { query: req.query });

  try {
    // безопасни числови стойности
    const pageNum = Math.max(Number.parseInt(req.query.page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(Number.parseInt(req.query.limit, 10) || 12, 1), 100);

    const {
      category,
      subcategory,
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'createdAt',
    } = req.query;

    const query = {};

    // category: приемаме id или slug
    if (category) {
      if (isValidObjectId(category)) {
        query.category = category;
      } else {
        const cat = await Category.findOne({ slug: category }).select('_id');
        if (cat) query.category = cat._id;
        else return res.json({ products: [], totalPages: 0, currentPage: pageNum, total: 0, hasNextPage: false, hasPrevPage: pageNum > 1 });
      }
    }

    // subcategory: приемаме id или slug
    if (subcategory) {
      if (isValidObjectId(subcategory)) {
        query.subcategory = subcategory;
      } else {
        const sub = await Subcategory.findOne({ slug: subcategory }).select('_id');
        if (sub) query.subcategory = sub._id;
        else return res.json({ products: [], totalPages: 0, currentPage: pageNum, total: 0, hasNextPage: false, hasPrevPage: pageNum > 1 });
      }
    }

    // цена
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = Number(minPrice);
      if (maxPrice) query.price.$lte = Number(maxPrice);
    }

    // наличност
    if (typeof inStock !== 'undefined') {
      if (inStock === 'true' || inStock === true) query.inStock = true;
      else if (inStock === 'false' || inStock === false) query.inStock = false;
    }

    // featured
    if (typeof featured !== 'undefined') {
      if (featured === 'true' || featured === true) query.featured = true;
      else if (featured === 'false' || featured === false) query.featured = false;
    }

    // търсене по име/описание
    if (search && String(search).trim() !== '') {
      const rx = new RegExp(String(search).trim(), 'i');
      query.$or = [{ name: rx }, { description: rx }];
    }

    // сортиране
    let sortOptions = {};
    switch (sort) {
      case 'price_asc':
        sortOptions = { price: 1 };
        break;
      case 'price_desc':
        sortOptions = { price: -1 };
        break;
      case 'name_asc':
        sortOptions = { name: 1 };
        break;
      case 'name_desc':
        sortOptions = { name: -1 };
        break;
      case 'newest':
      case 'createdAt':
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }

    const skip = (pageNum - 1) * limitNum;

    const [products, total] = await Promise.all([
      Product.find(query)
        .populate('category', 'name')
        .populate('subcategory', 'name')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum),
      Product.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limitNum);

    res.json({
      products,
      totalPages,
      currentPage: pageNum,
      total,
      hasNextPage: pageNum < totalPages,
      hasPrevPage: pageNum > 1,
    });
  } catch (error) {
    logger.error('Get products error', { error });
    res.status(500).json({ msg: 'Error fetching products' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Всички категории (public)
// ───────────────────────────────────────────────────────────────────────────────
router.get('/categories/all', async (_req, res) => {
  logger.info('GET /api/products/categories/all');
  try {
    const categories = await Category.find({}).sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    logger.error('Get categories error', { error });
    res.status(500).json({ msg: 'Error fetching categories' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Подкатегории по категория (public): приемаме slug или _id
// ───────────────────────────────────────────────────────────────────────────────
router.get('/subcategories/:categoryId', async (req, res) => {
  logger.info('GET /api/products/subcategories/:categoryId', { params: req.params });
  try {
    const { categoryId } = req.params;

    let cat = null;
    if (isValidObjectId(categoryId)) {
      cat = await Category.findById(categoryId);
    } else {
      cat = await Category.findOne({ slug: categoryId });
    }

    if (!cat) return res.json([]);

    const subcategories = await Subcategory.find({
      category: cat._id,
      isActive: true,
    }).sort({ sortOrder: 1, name: 1 });

    res.json(subcategories);
  } catch (error) {
    logger.error('Get subcategories error', { error });
    res.status(500).json({ msg: 'Error fetching subcategories' });
  }
});

// ───────────────────────────────────────────────────────────────────────────────
// Единичен продукт по ID – СЛЕД специфичните маршрути
// ───────────────────────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  logger.info('GET /api/products/:id', { params: req.params });
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('subcategory', 'name description');

    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }

    res.json(product);
  } catch (error) {
    logger.error('Get product error', { error });
    res.status(500).json({ msg: 'Error fetching product' });
  }
});

export default router;
