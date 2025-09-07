import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import User from './models/User.js';
import Product from './models/Product.js';
import Category from './models/Category.js';
import Subcategory from './models/Subcategory.js';

const seedData = async () => {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    

    // Remove all users with username 'admin' to ensure clean admin creation
    await User.deleteMany({ username: 'admin' });
    console.log('Deleted all users with username "admin". Creating new admin...');
    const adminPasswordHash = await bcrypt.hash('asdasd', 12);
    const adminUser = new User({
      email: 'admin@luxury.com',
      username: 'admin',
      password: adminPasswordHash,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    });
    await adminUser.save();
    console.log('Admin user created: admin / asdasd');

    // Create regular user if not exists
    let regularUser = await User.findOne({ email: 'user@example.com' });
    if (!regularUser) {
      console.log('Creating regular user...');
      const userPasswordHash = await bcrypt.hash('user123', 12);
      regularUser = new User({
        email: 'user@example.com',
        username: 'john',
        password: userPasswordHash,
        firstName: 'John',
        lastName: 'Doe',
        isAdmin: false
      });
      await regularUser.save();
    } else {
      console.log('Regular user already exists.');
    }


    // --- Нови категории със slug ---
    const categories = [
      { name: 'Люстри', slug: 'lyustri', description: 'Елегантни люстри за всяка стая', sortOrder: 1 },
      { name: 'Настолни лампи', slug: 'nastolni-lampi', description: 'Стилни настолни лампи за работа и четене', sortOrder: 2 },
      { name: 'Стенни лампи', slug: 'stenni-lampi', description: 'Модерни стенни лампи за акцентно осветление', sortOrder: 3 },
      { name: 'Подови лампи', slug: 'podovi-lampi', description: 'Дизайнерски подови лампи за атмосферно осветление', sortOrder: 4 },
      { name: 'LED осветление', slug: 'led-osvetlenie', description: 'Енергоспестяващо LED осветление', sortOrder: 5 },
      { name: 'Контакти', slug: 'kontakti', description: 'Електрически контакти за дома и офиса', sortOrder: 6 }
    ];
    // Insert categories if not exist
    let createdCategories = [];
    for (const cat of categories) {
      let found = await Category.findOne({ slug: cat.slug });
      if (!found) {
        found = await Category.create(cat);
        createdCategories.push(found);
      } else {
        createdCategories.push(found);
      }
    }
    console.log(`Categories in DB: ${createdCategories.length}`);

    // --- Подкатегории със slug ---
    const subcategories = [
      { name: 'Класически', slug: 'klasicheski', category: createdCategories[0]._id },
      { name: 'Модерни', slug: 'moderni', category: createdCategories[0]._id },
      { name: 'LED', slug: 'led', category: createdCategories[0]._id },
      { name: 'Дървени', slug: 'darveni', category: createdCategories[3]._id },
      { name: 'Метални', slug: 'metalni', category: createdCategories[3]._id },
      { name: 'RGB', slug: 'rgb', category: createdCategories[4]._id },
      { name: 'Бели', slug: 'beli', category: createdCategories[4]._id },
      // Може да добавите и подкатегории за контакти по тип, ако желаете
    ];
    // Insert subcategories if not exist
    let createdSubcategories = [];
    for (const sub of subcategories) {
      let found = await Subcategory.findOne({ slug: sub.slug, category: sub.category });
      if (!found) {
        found = await Subcategory.create(sub);
        createdSubcategories.push(found);
      } else {
        createdSubcategories.push(found);
      }
    }
    console.log(`Subcategories in DB: ${createdSubcategories.length}`);

    // Карта за бърз достъп
    const categoryMap = {};
    createdCategories.forEach(cat => { categoryMap[cat.name] = cat._id; });
    const subcategoryMap = {};
    createdSubcategories.forEach(sub => { subcategoryMap[sub.name] = sub._id; });

    // --- Продукти с подкатегории и контакти с марки/серии ---

    // Insert products if not exist
    let createdProducts = [];
    for (const prod of products) {
      let found = await Product.findOne({ name: prod.name });
      if (!found) {
        found = await Product.create(prod);
        createdProducts.push(found);
      } else {
        createdProducts.push(found);
      }
    }
    console.log(`Products in DB: ${createdProducts.length}`);

    console.log('\n=== Seed data created successfully! ===');
  console.log('Admin user: admin@luxury.com / asdasd');
    console.log('Regular user: user@example.com / user123');
    console.log(`Categories: ${createdCategories.length}`);
    console.log(`Products: ${createdProducts.length}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
