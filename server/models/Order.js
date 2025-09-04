import mongoose from 'mongoose';

const ShippingSchema = new mongoose.Schema({
  carrier: { type: String, enum: ['econt','speedy','other'], default: 'econt' },
  service: { type: String, default: 'standard' },
  toOffice: { type: Boolean, default: true },
  toOfficeId: { type: String, default: '' },
  city: { type: String, default: '' },
  address1: { type: String, default: '' },
  price: { type: Number, default: 0 },
  currency: { type: String, default: 'BGN' },
  tracking: { type: String, default: '' }
}, { _id: false });

const PaymentSchema = new mongoose.Schema({
  method: { type: String, enum: ['card','cod','bank'], default: 'cod' },
  status: { type: String, enum: ['pending','authorized','paid','failed','refunded'], default: 'pending' },
  codFee: { type: Number, default: 0 },
  currency: { type: String, default: 'BGN' },
  provider: { type: String, default: '' },
  providerIntentId: { type: String, default: '' }
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }
  ],
  subtotal: { type: Number, default: 0 },
  shipping: { type: ShippingSchema, default: () => ({}) },
  payment: { type: PaymentSchema, default: () => ({}) },
  grandTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'BGN' },
  phone: { type: String, default: '' },
  customerName: { type: String, default: '' },
  email: { type: String, default: '' },
  notes: { type: String, default: '' },
  total: Number, // backwards compatibility
  createdAt: { type: Date, default: Date.now }
});

// keep compat: if total not set, set from grandTotal
OrderSchema.pre('save', function(next){
  if (!this.total) this.total = this.grandTotal || this.subtotal;
  next();
});

export default mongoose.model('Order', OrderSchema);