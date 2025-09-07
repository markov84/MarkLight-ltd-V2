import mongoose from 'mongoose';
import slugify from 'slugify';

const SubcategorySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true
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

// Автоматично генериране на slug от името, ако липсва, с уникалност
SubcategorySchema.pre('validate', async function(next) {
  if (this.name) {
    let baseSlug = slugify(this.name, { lower: true, strict: true, locale: 'bg' });
    let slug = baseSlug;
    let counter = 1;
    // Проверка за уникалност на slug-а
    while (await mongoose.models.Subcategory.findOne({ slug, _id: { $ne: this._id } })) {
      slug = `${baseSlug}-${counter++}`;
    }
    this.slug = slug;
  }
  next();
});

// Ensure subcategory names are unique within each category
SubcategorySchema.index({ name: 1, category: 1 }, { unique: true });

export default mongoose.model('Subcategory', SubcategorySchema);
