 import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  username: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    minlength: 3,
    maxlength: 30
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  firstName: {
    type: String,
    trim: true,
    default: ''
  },
  lastName: {
    type: String,
    trim: true,
    default: ''
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true // This adds createdAt and updatedAt fields
});

export default mongoose.model('User', UserSchema);
