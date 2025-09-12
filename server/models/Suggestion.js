import mongoose from 'mongoose';

const SuggestionSchema = new mongoose.Schema({
  text: { 
    type: String, 
    required: true 
  },
  user: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User' 
  },
  response: { 
    type: String 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  },
  updatedAt: { 
    type: Date 
  },
});

export default mongoose.models.Suggestion || mongoose.model('Suggestion', SuggestionSchema);
