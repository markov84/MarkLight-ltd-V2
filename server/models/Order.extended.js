import mongoose from 'mongoose';

const AddressSchema = new mongoose.Schema({
  country: String,
  city: String,
  postcode: String,
  address1: String,
  address2: String,
  phone: String,
  firstName: String,
  lastName: String,
});

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number,
      price: Number,
    }
  ],
  totals: {
    subtotal: Number,
    shipping: Number,
    codFee: Number,
    discount: Number,
    grandTotal: Number,
    currency: { type: String, default: "BGN" }
  },
  shipping: {
    carrier: { type: String, enum: ["econt", "speedy", "other"] },
    method: String,
    toOfficeId: String,
    trackingNumber: String,
    labelUrl: String,
    address: AddressSchema
  },
  payment: {
    method: { type: String, enum: ["card", "cod"] },
    stripePaymentIntentId: String,
    status: { type: String, enum: ["pending", "paid", "failed", "cod_pending"], default: "pending" }
  },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Order', OrderSchema);
