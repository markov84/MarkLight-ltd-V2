import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  to: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // null ако е админ
  text: { type: String, required: true },
  sentAt: { type: Date, default: Date.now },
  read: { type: Boolean, default: false }
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
