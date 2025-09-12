import dotenv from 'dotenv';
dotenv.config({path:'./server/.env'});
import mongoose from 'mongoose';

const ReviewSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now }
});

const Review = mongoose.model('Review', ReviewSchema);

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  const r = await Review.findById('68bef6e18eacef2813a0c1f8');
  console.log(r ? r : 'No review found');
  process.exit(0);
}

main();
