// Файлът е премахнат като ненужен.
// Файлът е премахнат като ненужен.
import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Product from '../models/Product.js';

dotenv.config();

const sampleProducts = [
  {
    name: "Кристален полилей Florence",
    description: "Елегантен кристален полилей с 12 осветителни тела. Перфектен за класически интериор с височина на тавана над 3 метра.",
    price: 2450.00,
    image: "https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Полилеи",
    inStock: true,
    featured: true
  },
  {
    name: "Модерна LED таванна лампа",
    description: "Енергоспестяваща LED лампа с възможност за димиране. Подходяща за всекидневна или спалня.",
    price: 320.50,
    image: "https://images.unsplash.com/photo-1524484485831-a92ffc0de03f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Таванни лампи",
    inStock: true,
    featured: false
  },
  {
    name: "Индустриален пендантен аплик",
    description: "Стилен метален аплик в индустриален стил. Идеален за кухня или работно пространство.",
    price: 180.00,
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Аплици",
    inStock: true,
    featured: true
  },
  {
    name: "Настолна лампа с дървена основа",
    description: "Елегантна настолна лампа с естествена дървена основа и текстилен абажур.",
    price: 95.75,
    image: "https://images.unsplash.com/photo-1513506003901-1e6a229e2d15?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Настолни лампи",
    inStock: true,
    featured: false
  },
  {
    name: "Smart LED ленти",
    description: "Цветни RGB LED ленти с Wi-Fi управление чрез мобилно приложение. 5 метра в комплекта.",
    price: 125.00,
    image: "https://images.unsplash.com/photo-1563089145-599997674d42?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "LED осветление",
    inStock: true,
    featured: false
  },
  {
    name: "Винтидж Edison лампи комплект",
    description: "Комплект от 6 броя винтидж Edison лампи с топла светлина. Перфектни за ретро интериор.",
    price: 65.00,
    image: "https://images.unsplash.com/photo-1519408299519-b7c79c3fef3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Лампи",
    inStock: true,
    featured: false
  },
  {
    name: "Външен соларен прожектор",
    description: "Водоустойчив соларен LED прожектор за външно осветление. Автоматично включване при здрач.",
    price: 89.99,
    image: "https://images.unsplash.com/photo-1581833971358-2c8b550f87b3?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Външно осветление",
    inStock: true,
    featured: false
  },
  {
    name: "Дизайнерски нощни лампи",
    description: "Комплект от 2 модерни нощни лампи със сензор за движение. Идеални за спалня.",
    price: 55.50,
    image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80",
    category: "Нощни лампи",
    inStock: true,
    featured: true
  }
];

async function seedData() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Product.deleteMany({});
    console.log('Cleared existing data');

    // Create admin user
    const adminPassword = await bcrypt.hash('password123', 12);
    const adminUser = new User({
      email: 'admin@luxury.com',
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User',
      isAdmin: true
    });
    await adminUser.save();
    console.log('Created admin user');

    // Create regular user
    const userPassword = await bcrypt.hash('password123', 12);
    const regularUser = new User({
      email: 'user@luxury.com',
      password: userPassword,
      firstName: 'Test',
      lastName: 'User',
      isAdmin: false
    });
    await regularUser.save();
    console.log('Created regular user');

    // Create sample products
    await Product.insertMany(sampleProducts);
    console.log('Created sample products');

    console.log('Sample data seeded successfully!');
    console.log('Admin credentials: admin@luxury.com / password123');
    console.log('User credentials: user@luxury.com / password123');

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedData();
}
