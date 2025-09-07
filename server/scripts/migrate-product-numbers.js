// Скрипт за добавяне на уникални productNumber към всички стари продукти
import mongoose from 'mongoose';
import Product from '../models/Product.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/marklight';

function formatNumber(n) {
  return `M-L-${String(n).padStart(6, '0')}`;
}

async function main() {
  await mongoose.connect(MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
  const products = await Product.find({ productNumber: { $exists: false } }).sort({ createdAt: 1 });
  const maxExisting = await Product.find({ productNumber: { $exists: true } })
    .sort({ productNumber: -1 })
    .limit(1);
  let start = 1;
  if (maxExisting.length && /^M-L-(\d{6})$/.test(maxExisting[0].productNumber)) {
    start = parseInt(maxExisting[0].productNumber.slice(4), 10) + 1;
  }
  let count = 0;
  for (let i = 0; i < products.length; i++) {
    const num = formatNumber(start + i);
    products[i].productNumber = num;
    await products[i].save();
    console.log(`Set productNumber ${num} for product ${products[i]._id}`);
    count++;
  }
  console.log(`\nГотово! Обновени продукти: ${count}`);
  await mongoose.disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });
