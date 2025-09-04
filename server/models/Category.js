
import mongoose from 'mongoose';
import slugify from 'slugify';


const CategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  image: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// ВИНАГИ генерирай slug от name преди валидация (по-добре с пакет slugify)
CategorySchema.pre('validate', function(next) {
  if (this.name) {
    this.slug = slugify(this.name, { lower: true, strict: true, locale: 'bg' });
  }
  console.log('Category pre-validate hook after set', this.name, this.slug);
  next();
});

export default mongoose.model('Category', CategorySchema);
