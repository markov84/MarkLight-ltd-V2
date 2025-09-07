 import mongoose from 'mongoose';

const ProductSchema = new mongoose.Schema({
  supplier: {
    type: String,
    trim: true,
    default: ''
  },
  productCode: {
    type: String,
    trim: true,
    default: ''
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  priceEUR: {
    type: Number,
    min: 0
  },
  originalPrice: {
    type: Number,
    min: 0
  },
  originalPriceEUR: {
    type: Number,
    min: 0
  },
  image: {
    type: String,
    default: ''
  },
  images: [{
    type: String
  }],
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Subcategory'
  },
  brand: {
    type: String,
    trim: true
  },
  model: {
    type: String,
    trim: true
  },
  specifications: {
    type: Map,
    of: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  inStock: {
    type: Boolean,
    default: true
  },
  stockQuantity: {
    type: Number,
    default: 0,
    min: 0
  },
  featured: {
    type: Boolean,
    default: false
  },
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  reviewCount: {
    type: Number,
    default: 0,
    min: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true, // This adds createdAt and updatedAt fields
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Exchange rate constant: 1 EUR = 1.95583 BGN
const EUR_TO_BGN_RATE = 1.95583;

// Pre-save middleware to calculate EUR prices from BGN prices
ProductSchema.pre('save', function(next) {
  if (this.price && (!this.priceEUR || this.isModified('price'))) {
    this.priceEUR = Math.round((this.price / EUR_TO_BGN_RATE) * 100) / 100;
  }
  if (this.originalPrice && (!this.originalPriceEUR || this.isModified('originalPrice'))) {
    this.originalPriceEUR = Math.round((this.originalPrice / EUR_TO_BGN_RATE) * 100) / 100;
  }
  next();
});

// Virtual field for exchange rate
ProductSchema.virtual('exchangeRate').get(function() {
  return EUR_TO_BGN_RATE;
});

// Index for better search performance
ProductSchema.index({ name: 'text', description: 'text' });
ProductSchema.index({ category: 1 });
ProductSchema.index({ price: 1 });

export default mongoose.model('Product', ProductSchema);
