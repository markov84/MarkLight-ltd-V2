import express from 'express';
import Wishlist from '../models/Wishlist.js';
import Product from '../models/Product.js';
import { auth } from '../utils/auth.js';

const router = express.Router();

// Вземи wishlist на текущия потребител
router.get('/', auth, async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id }).populate('products');
  res.json(wishlist || { products: [] });
});

// Добави продукт към wishlist
router.post('/add/:productId', auth, async (req, res) => {
  let wishlist = await Wishlist.findOne({ user: req.user.id });
  if (!wishlist) wishlist = new Wishlist({ user: req.user.id, products: [] });
  if (!wishlist.products.includes(req.params.productId)) {
    wishlist.products.push(req.params.productId);
    await wishlist.save();
  }
  res.json(wishlist);
});

// Премахни продукт от wishlist
router.post('/remove/:productId', auth, async (req, res) => {
  const wishlist = await Wishlist.findOne({ user: req.user.id });
  if (wishlist) {
    wishlist.products = wishlist.products.filter(p => p.toString() !== req.params.productId);
    await wishlist.save();
    res.json(wishlist);
  } else {
    res.status(404).json({ msg: 'Wishlist not found' });
  }
});

export default router;
