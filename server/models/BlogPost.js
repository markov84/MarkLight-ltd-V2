import mongoose from 'mongoose';

const blogPostSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: String,
  excerpt: String,
  featuredImage: String,
  gallery: [String],
  metaTitle: String,
  metaDescription: String,
  relatedProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  isPublished: { type: Boolean, default: false },
  publishedAt: Date,
  views: { type: Number, default: 0 }
});

export default mongoose.model('BlogPost', blogPostSchema);
