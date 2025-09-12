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
  const id = process.argv[2];
  if (!id) {
    console.log('Please provide a review _id as argument');
    process.exit(1);
  }
  const found = await Review.findById(id);
  console.log('Found review:', found);
  if (!found) {
    console.log('No review found with this _id');
    process.exit(1);
  }
  const deleted = await Review.findByIdAndDelete(id);
  console.log('Deleted review:', deleted);
  process.exit(0);
}

main();