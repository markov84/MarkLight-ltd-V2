 import express from 'express';
import Product from '../models/Product.js';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

const router = express.Router();

// Get all products with filters
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 12, 
      category, 
      subcategory, 
      search,
      minPrice,
      maxPrice,
      inStock,
      featured,
      sort = 'createdAt'
    } = req.query;
    
  let query = {}; // Show all products by default
    
    // Позволява филтриране по slug или _id
    const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);
    if (category) {
      let cat = null;
      if (isValidObjectId(category)) {
        cat = await Category.findById(category);
      } else {
        cat = await Category.findOne({ slug: category });
      }
      if (!cat) {
        return res.json({ products: [], totalPages: 0, currentPage: parseInt(page), total: 0, hasNextPage: false, hasPrevPage: false });
      }
      query.category = cat._id;
    }
    if (subcategory) {
      let subcat = null;
      if (isValidObjectId(subcategory)) {
        subcat = await Subcategory.findById(subcategory);
      } else {
        subcat = await Subcategory.findOne({ slug: subcategory });
      }
      if (!subcat) {
        return res.json({ products: [], totalPages: 0, currentPage: parseInt(page), total: 0, hasNextPage: false, hasPrevPage: false });
      }
      query.subcategory = subcat._id;
    }
    if (inStock !== undefined) query.inStock = inStock === 'true';
    if (featured !== undefined) query.featured = featured === 'true';
    
    if (search) {
      query.name = { $regex: search, $options: 'i' };
    }
    
    if (minPrice || maxPrice) {
      query.price = {};
      if (minPrice) query.price.$gte = parseFloat(minPrice);
      if (maxPrice) query.price.$lte = parseFloat(maxPrice);
    }
    
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
        sortOptions = { createdAt: -1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    }
    
    const skip = (page - 1) * limit;
    const products = await Product.find(query)
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort(sortOptions)
      .skip(skip)
      .limit(parseInt(limit));
    
    const total = await Product.countDocuments(query);
    
    res.json({
      products,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1
    });
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ msg: 'Error fetching products' });
  }
});

// Get single product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await Product.findById(req.params.id)
      .populate('category', 'name description')
      .populate('subcategory', 'name description');
    
    if (!product) {
      return res.status(404).json({ msg: 'Product not found' });
    }
    
    res.json(product);
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({ msg: 'Error fetching product' });
  }
});

// Get featured products
router.get('/featured/list', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 6;
    const products = await Product.find({ featured: true, inStock: true })
      .populate('category', 'name')
      .populate('subcategory', 'name')
      .sort({ createdAt: -1 })
      .limit(limit);
    
    res.json(products);
  } catch (error) {
    console.error('Get featured products error:', error);
    res.status(500).json({ msg: 'Error fetching featured products' });
  }
});

// Get all categories (public)
router.get('/categories/all', async (req, res) => {
  try {
    // Покажи всички категории, без значение дали са активни
    const categories = await Category.find({})
      .sort({ sortOrder: 1, name: 1 });
    res.json(categories);
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ msg: 'Error fetching categories' });
  }
});

// Get subcategories by category (public)
router.get('/subcategories/:categoryId', async (req, res) => {
  try {
    // Позволява заявка по slug или _id
    let categoryId = req.params.categoryId;
    const isValidObjectId = (id) => /^[a-fA-F0-9]{24}$/.test(id);
    let cat = null;
    if (isValidObjectId(categoryId)) {
      cat = await Category.findById(categoryId);
    } else {
      cat = await Category.findOne({ slug: categoryId });
    }
    if (!cat) return res.json([]);
    const subcategories = await Subcategory.find({ 
      category: cat._id,
      isActive: true 
    }).sort({ sortOrder: 1, name: 1 });
    res.json(subcategories);
  } catch (error) {
    console.error('Get subcategories error:', error);
    res.status(500).json({ msg: 'Error fetching subcategories' });
  }
});

export default router;
