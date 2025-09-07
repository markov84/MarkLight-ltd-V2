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

const OrderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  items: [
    {
      product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
      quantity: Number
    }
  ],
  grandTotal: { type: Number, default: 0 },
  currency: { type: String, default: 'BGN' },
  phone: { type: String, default: '' },
  customerName: { type: String, default: '' },
  email: { type: String, default: '' },
  notes: { type: String, default: '' },
  status: { type: String, default: 'new', enum: ['new', 'processing', 'shipped', 'completed', 'cancelled'] },
  total: Number, // backwards compatibility
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// keep compat: if total not set, set from grandTotal
OrderSchema.pre('save', function(next){
  if (!this.total) this.total = this.grandTotal || this.subtotal;
  next();
});

export default mongoose.model('Order', OrderSchema);