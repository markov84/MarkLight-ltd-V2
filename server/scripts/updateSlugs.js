import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });
import mongoose from 'mongoose';
import Category from '../models/Category.js';
import Subcategory from '../models/Subcategory.js';

function slugify(str) {
  return str
    .toString()
    .toLowerCase()
    .replace(/[^a-zA-Z0-9а-яА-Я]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

async function updateSlugs() {
  await mongoose.connect(process.env.MONGO_URI);
  // Categories
  const categories = await Category.find();
  for (const cat of categories) {
    if (!cat.slug) {
      cat.slug = slugify(cat.name);
      await cat.save();
      console.log(`Category: ${cat.name} -> ${cat.slug}`);
    }
  }
  // Subcategories
  const subcategories = await Subcategory.find();
  for (const sub of subcategories) {
    if (!sub.slug) {
      sub.slug = slugify(sub.name);
      await sub.save();
      console.log(`Subcategory: ${sub.name} -> ${sub.slug}`);
    }
  }
  await mongoose.disconnect();
  console.log('All slugs updated!');
}

updateSlugs();
